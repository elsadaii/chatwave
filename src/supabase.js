import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ofjmekyqgoyxwiiieylf.supabase.co'
const supabaseAnonKey = 'sb_publishable_28XnRqAKU1YVgFnCz2sAyg_KRH8ih-W'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)