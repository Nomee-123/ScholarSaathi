const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

function isLocalUrl(url: URL): boolean {
  return url.hostname === 'localhost' || url.hostname === '127.0.0.1'
}

function isSecretKey(key: string): boolean {
  if (key.startsWith('sb_secret_') || key.toLocaleLowerCase().includes('service_role')) return true
  const payload = key.split('.')[1]
  if (!payload) return false
  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const claims = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))) as { role?: string }
    return claims.role === 'service_role'
  } catch {
    return false
  }
}

function validateConfig(): { configured: boolean; message: string } {
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      configured: false,
      message: 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in a local .env.local file. Authentication is currently disabled.',
    }
  }
  let parsedUrl: URL
  try {
    parsedUrl = new URL(supabaseUrl)
  } catch {
    return { configured: false, message: 'VITE_SUPABASE_URL must be a valid HTTPS URL (HTTP is allowed only for localhost).' }
  }
  if (parsedUrl.protocol !== 'https:' && !(parsedUrl.protocol === 'http:' && isLocalUrl(parsedUrl))) {
    return { configured: false, message: 'VITE_SUPABASE_URL must use HTTPS, except for a local Supabase development URL.' }
  }
  if (isSecretKey(supabaseAnonKey)) {
    return {
      configured: false,
      message: 'A secret or service-role key was detected. Remove it. The browser may only use the Supabase anon/publishable key.',
    }
  }
  return { configured: true, message: 'Supabase configuration is present. Verify your project URL, public key, email settings, and database policies.' }
}

export const supabaseConfiguration = validateConfig()
export const supabasePublicConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
}
