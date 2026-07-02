import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// `experimental.passkey` opts into Supabase's beta Passkey/WebAuthn API
// (registerPasskey/signInWithPasskey). Per Supabase: "experimental, may
// change without notice." Requires Passkey auth + Relying Party ID/Origins
// to be configured in the Supabase Dashboard, or these calls will fail.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    experimental: { passkey: true },
  },
})

// Cookie-backed browser client used only for sending email OTPs (see AuthCard).
// NOTE: this stores its session in cookies, while `supabase` above stores in localStorage —
// they are not automatically in sync. verifyOtp/passkey sign-in intentionally use the
// `supabase` client above so the resulting session lands where the rest of the app expects it.
export const supabaseAuthClient = createBrowserClient(supabaseUrl, supabaseAnonKey)