import { createClient } from '@supabase/supabase-js'
import { LargeSecureStore } from '@/utils/large-secure-store'
import { Database } from '@/types/database.types'


// Typing the client makes every .rpc() call check its arguments and return
// shape against the real schema, so RPC/screen mismatches fail at compile time
// instead of at runtime on a device.
export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '',
  {
    auth: {
      storage: LargeSecureStore,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      // PKCE lets the OAuth code exchange (utils/oauth.ts) happen from the
      // system browser redirect without ever handling the user's tokens directly.
      flowType: 'pkce',
    },
  }
)