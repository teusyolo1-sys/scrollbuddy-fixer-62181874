import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Base32 alphabet
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32Encode(buf: Uint8Array): string {
  let bits = 0, value = 0, out = ''
  for (const byte of buf) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31]
  return out
}

function base32Decode(s: string): Uint8Array {
  const cleaned = s.replace(/=+$/, '').toUpperCase()
  let bits = 0, value = 0
  const out: number[] = []
  for (const c of cleaned) {
    const idx = B32.indexOf(c)
    if (idx === -1) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return new Uint8Array(out)
}

function generateTOTPSecret(): string {
  const bytes = new Uint8Array(20)
  crypto.getRandomValues(bytes)
  return base32Encode(bytes)
}

async function computeHOTP(secret: string, counter: bigint): Promise<string> {
  const keyData = base32Decode(secret)
  const counterBytes = new ArrayBuffer(8)
  new DataView(counterBytes).setBigUint64(0, counter, false)

  const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, counterBytes)
  const hash = new Uint8Array(sig)
  const offset = hash[hash.length - 1] & 0x0f
  const code = ((hash[offset] & 0x7f) << 24 | hash[offset + 1] << 16 | hash[offset + 2] << 8 | hash[offset + 3]) % 1000000
  return code.toString().padStart(6, '0')
}

async function verifyTOTP(secret: string, token: string, window = 1): Promise<boolean> {
  const counter = BigInt(Math.floor(Date.now() / 30000))
  for (let i = -window; i <= window; i++) {
    const expected = await computeHOTP(secret, counter + BigInt(i))
    if (expected === token) return true
  }
  return false
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  const body = await req.json()
  const action = body.action as string

  if (action === 'setup') {
    const secret = generateTOTPSecret()
    const issuer = 'TaskFlow'
    const account = user.email || user.id
    const otpauthUrl = `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&digits=6&period=30`

    await supabase.from('admin_totp').upsert({
      user_id: user.id,
      totp_secret: secret,
      is_verified: false,
    }, { onConflict: 'user_id' })

    return new Response(JSON.stringify({
      secret,
      otpauth_url: otpauthUrl,
      qr_data: otpauthUrl,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  if (action === 'verify_setup') {
    const { data: totp } = await supabase.from('admin_totp').select('*').eq('user_id', user.id).single()
    if (!totp) return new Response(JSON.stringify({ error: 'TOTP not configured' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const valid = await verifyTOTP(totp.totp_secret, body.code)
    if (!valid) return new Response(JSON.stringify({ valid: false, error: 'Código inválido' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    await supabase.from('admin_totp').update({ is_verified: true }).eq('user_id', user.id)
    return new Response(JSON.stringify({ valid: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  if (action === 'verify') {
    const { data: totp } = await supabase.from('admin_totp').select('*').eq('user_id', user.id).eq('is_verified', true).single()
    if (!totp) return new Response(JSON.stringify({ valid: false, error: 'TOTP não configurado' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const valid = await verifyTOTP(totp.totp_secret, body.code)
    return new Response(JSON.stringify({ valid }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  if (action === 'status') {
    const { data: totp } = await supabase.from('admin_totp').select('is_verified').eq('user_id', user.id).single()
    return new Response(JSON.stringify({ configured: !!totp?.is_verified }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
