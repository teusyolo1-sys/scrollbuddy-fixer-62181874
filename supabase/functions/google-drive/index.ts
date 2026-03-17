import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const SERVICE_EMAIL = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL')!
const PRIVATE_KEY = (Deno.env.get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY') || '').replace(/\\n/g, '\n')
const ROOT_FOLDER_ID = Deno.env.get('GOOGLE_DRIVE_ROOT_FOLDER_ID')!

// Generate JWT for Google API auth
async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({
    iss: SERVICE_EMAIL,
    scope: 'https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))

  const pemContents = PRIVATE_KEY
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '')
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signatureInput = new TextEncoder().encode(`${header}.${payload}`)
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, signatureInput)
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const jwt = `${header}.${payload}.${signatureB64}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })
  const tokenData = await tokenRes.json()
  return tokenData.access_token
}

// Create folder in Drive
async function createFolder(name: string, parentId: string, token: string): Promise<string> {
  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    }),
  })
  const data = await res.json()
  return data.id
}

// List files in folder
async function listFiles(folderId: string, token: string) {
  const query = `'${folderId}' in parents and trashed = false`
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,modifiedTime,webViewLink,iconLink,thumbnailLink)&orderBy=modifiedTime desc&pageSize=100`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  )
  const data = await res.json()
  return data.files || []
}

// Upload file
async function uploadFile(fileName: string, fileData: Uint8Array, mimeType: string, folderId: string, token: string) {
  const metadata = JSON.stringify({ name: fileName, parents: [folderId] })
  const boundary = 'taskflow_boundary'

  const bodyParts = [
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
    `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
  ]

  const encoder = new TextEncoder()
  const part1 = encoder.encode(bodyParts[0])
  const part2 = encoder.encode(bodyParts[1])
  const ending = encoder.encode(`\r\n--${boundary}--`)

  const combined = new Uint8Array(part1.length + part2.length + fileData.length + ending.length)
  combined.set(part1, 0)
  combined.set(part2, part1.length)
  combined.set(fileData, part1.length + part2.length)
  combined.set(ending, part1.length + part2.length + fileData.length)

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: combined,
    }
  )
  return await res.json()
}

// Delete file
async function deleteFile(fileId: string, token: string) {
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action') || ''

    // Diagnostic endpoint - no auth required
    if (action === 'diagnose') {
      const diag: Record<string, any> = {
        SERVICE_EMAIL_exists: !!SERVICE_EMAIL,
        SERVICE_EMAIL_value: SERVICE_EMAIL ? SERVICE_EMAIL.substring(0, 10) + '...' : null,
        PRIVATE_KEY_exists: !!PRIVATE_KEY,
        PRIVATE_KEY_starts: PRIVATE_KEY ? PRIVATE_KEY.substring(0, 30) : null,
        ROOT_FOLDER_ID_exists: !!ROOT_FOLDER_ID,
        ROOT_FOLDER_ID_value: ROOT_FOLDER_ID || null,
      }
      
      // Try to get an access token
      try {
        const token = await getAccessToken()
        diag.token_obtained = !!token
        diag.token_preview = token ? token.substring(0, 20) + '...' : null
        
        // Try to list files in root folder
        const query = `'${ROOT_FOLDER_ID}' in parents and trashed = false`
        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&pageSize=5`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        )
        const data = await res.json()
        diag.drive_api_status = res.status
        diag.drive_api_response = data
      } catch (e: any) {
        diag.token_error = e.message
      }
      
      return new Response(JSON.stringify(diag, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!SERVICE_EMAIL || !PRIVATE_KEY || !ROOT_FOLDER_ID) {
      return new Response(JSON.stringify({ error: 'Google Drive secrets not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = await getAccessToken()

    // ENSURE FOLDER
    if (action === 'ensure_folder') {
      const { company_id, company_name } = await req.json()

      const { data: existing } = await supabase
        .from('company_drive_folders')
        .select('drive_folder_id')
        .eq('company_id', company_id)
        .single()

      if (existing?.drive_folder_id) {
        return new Response(JSON.stringify({ folder_id: existing.drive_folder_id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const folderId = await createFolder(company_name, ROOT_FOLDER_ID, token)

      await supabase.from('company_drive_folders').insert({
        company_id,
        drive_folder_id: folderId,
        folder_name: company_name,
      })

      return new Response(JSON.stringify({ folder_id: folderId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // LIST FILES
    if (action === 'list') {
      const folderId = url.searchParams.get('folder_id')
      if (!folderId) throw new Error('folder_id required')
      const files = await listFiles(folderId, token)
      return new Response(JSON.stringify({ files }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // UPLOAD FILE
    if (action === 'upload') {
      const formData = await req.formData()
      const file = formData.get('file') as File
      const folderId = formData.get('folder_id') as string

      if (!file || !folderId) throw new Error('file and folder_id required')

      const buffer = new Uint8Array(await file.arrayBuffer())
      const result = await uploadFile(file.name, buffer, file.type || 'application/octet-stream', folderId, token)

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // DELETE FILE
    if (action === 'delete') {
      const { file_id } = await req.json()
      if (!file_id) throw new Error('file_id required')
      await deleteFile(file_id, token)
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // CREATE SUBFOLDER
    if (action === 'create_folder') {
      const { folder_name, parent_id } = await req.json()
      if (!folder_name || !parent_id) throw new Error('folder_name and parent_id required')
      const newId = await createFolder(folder_name, parent_id, token)
      return new Response(JSON.stringify({ folder_id: newId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('Google Drive error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
