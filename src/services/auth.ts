async function clientOrThrow() {
  const { supabase } = await import('./supabase')
  if (!supabase) throw new Error('Authentication is not configured. Use guest mode or follow the Supabase setup steps.')
  return supabase
}

export async function signInWithEmail(email: string, password: string): Promise<string> {
  const client = await clientOrThrow()
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
  return 'You are signed in.'
}

export async function signUpWithEmail(email: string, password: string): Promise<{ message: string; hasSession: boolean }> {
  const client = await clientOrThrow()
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.origin },
  })
  if (error) throw error
  return {
    message: data.session
      ? 'Your account is created and signed in.'
      : 'Your account request was accepted. Check your email for a confirmation link before logging in.',
    hasSession: Boolean(data.session),
  }
}

export async function sendPasswordReset(email: string): Promise<string> {
  const client = await clientOrThrow()
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  })
  if (error) throw error
  return 'If an account exists for that address, password reset instructions will be sent.'
}

export async function updatePassword(password: string): Promise<string> {
  const client = await clientOrThrow()
  const { error } = await client.auth.updateUser({ password })
  if (error) throw error
  return 'Your password was updated.'
}

export async function signOut(): Promise<void> {
  const client = await clientOrThrow()
  const { error } = await client.auth.signOut()
  if (error) throw error
}
