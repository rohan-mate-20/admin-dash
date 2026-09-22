import { supabase } from './supabaseClient'

/**
 * Call this on every admin page. Returns the logged-in admin's
 * info (including role), or null if not logged in / not an admin.
 * Rohan: use this to decide whether to show regular Admin screens
 * or Super Admin screens (Orders, Reports, Customers).
 */
export async function getCurrentAdmin() {
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) return null

  const { data: admin } = await supabase
    .from('admins')
    .select('id, name, email, role')
    .eq('auth_user_id', authData.user.id)
    .maybeSingle()

  return admin // null if this login isn't an admin at all; otherwise has .role
}

export async function loginAdmin(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function logoutAdmin() {
  await supabase.auth.signOut()
}
