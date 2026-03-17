import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const SERVICE_EMAIL = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL')!
const PRIVATE_KEY = (Deno.env.get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY') || '').replace(/\\n/g, '\n')
const ROOT_FOLDER_ID = Deno.env.get('GOOGLE_DRIVE_ROOT_FOLDER_ID')!

async function parseGoogleResponse(response: Response, action: string) {
  const payload = await response.json().catch(async () => ({ error: { message: await response.text().catch(() => '') } }))

  if (!response.ok) {
    console.error(`Google Drive ${action} failed`, {
      status: response.status,
      payload,
    })
    throw new Error(payload?.error?.message || `Google Drive ${action} failed`)
  }

  return payload
}

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

  const tokenData = await parseGoogleResponse(tokenRes, 'token')

  if (!tokenData.access_token) {
    throw new Error('Google OAuth did not return an access token')
  }

  return tokenData.access_token
}

async function createFolder(name: string, parentId: string, token: string): Promise<string> {
  const response = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&fields=id,name,mimeType,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    }),
  })

  const data = await parseGoogleResponse(response, 'create_folder')

  if (!data.id) {
    throw new Error('Google Drive did not return the folder id')
  }

  return data.id
}

async function listFiles(folderId: string, token: string) {
  const query = `'${folderId}' in parents and trashed = false`
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,modifiedTime,webViewLink,iconLink,thumbnailLink)&orderBy=folder,name&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  const data = await parseGoogleResponse(response, 'list_files')
  return data.files || []
}

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

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink&supportsAllDrives=true',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: combined,
    }
  )

  return await parseGoogleResponse(response, 'upload_file')
}

async function deleteFile(fileId: string, token: string) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    await parseGoogleResponse(response, 'delete_file')
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action') || ''

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

    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const tokenValue = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(tokenValue)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const googleToken = await getAccessToken()

    if (action === 'ensure_folder') {
      const { company_id, company_name } = await req.json()

      if (!company_id || !company_name) {
        throw new Error('company_id and company_name required')
      }

      const { data: existing, error: existingError } = await supabase
        .from('company_drive_folders')
        .select('id, drive_folder_id')
        .eq('company_id', company_id)
        .maybeSingle()

      if (existingError) {
        throw existingError
      }

      if (existing?.drive_folder_id) {
        return new Response(JSON.stringify({ folder_id: existing.drive_folder_id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const folderId = await createFolder(company_name, ROOT_FOLDER_ID, googleToken)

      if (existing?.id) {
        const { error: updateError } = await supabase
          .from('company_drive_folders')
          .update({
            drive_folder_id: folderId,
            folder_name: company_name,
          })
          .eq('id', existing.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from('company_drive_folders').insert({
          company_id,
          drive_folder_id: folderId,
          folder_name: company_name,
        })

        if (insertError) throw insertError
      }

      return new Response(JSON.stringify({ folder_id: folderId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'list') {
      const folderId = url.searchParams.get('folder_id')
      if (!folderId) throw new Error('folder_id required')

      const files = await listFiles(folderId, googleToken)
      return new Response(JSON.stringify({ files }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'upload') {
      const formData = await req.formData()
      const file = formData.get('file') as File
      const folderId = formData.get('folder_id') as string

      if (!file || !folderId) throw new Error('file and folder_id required')

      const buffer = new Uint8Array(await file.arrayBuffer())
      const result = await uploadFile(file.name, buffer, file.type || 'application/octet-stream', folderId, googleToken)

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'delete') {
      const { file_id } = await req.json()
      if (!file_id) throw new Error('file_id required')

      await deleteFile(file_id, googleToken)
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'create_folder') {
      const { folder_name, parent_id } = await req.json()
      if (!folder_name || !parent_id) throw new Error('folder_name and parent_id required')

      const newId = await createFolder(folder_name.trim(), parent_id, googleToken)
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
    return new Response(JSON.stringify({ error: err.message || 'Unknown Google Drive error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
