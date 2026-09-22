import { createClient } from '@supabase/supabase-js'

// IMPORTANT: this file only ever uses the PUBLIC (anon) key.
// The secret service_role key must NEVER appear in this project.
// If you ever see NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY or similar
// being used here, stop and ask before committing it.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
