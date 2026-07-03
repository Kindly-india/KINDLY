import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// `experimental.passkey` opts into Supabase's beta Passkey/WebAuthn API
// (registerPasskey/signInWithPasskey). Per Supabase: "experimental, may
// change without notice." Requires Passkey auth + Relying Party ID/Origins
// to be configured in the Supabase Dashboard, or these calls will fail.
//
// `flowType: 'pkce'` is required for signInWithOAuth (Google) to redirect
// back with a `?code=` query param — without it, Supabase defaults to the
// implicit flow and returns tokens in the URL hash instead, which
// app/auth/callback/page.tsx's exchangeCodeForSession() can't consume.
//
// `detectSessionInUrl: false` — without this, the client auto-consumes any
// `?code=` in the URL the instant it's constructed (module load), racing
// ahead of the callback page's own explicit exchangeCodeForSession() call
// and deleting the one-time PKCE verifier first. That left the explicit
// call failing with "PKCE code verifier not found in storage" every time.
// We want the callback page's manual exchange to be the only thing that
// ever touches the code, so auto-detection is off here.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: false,
    experimental: { passkey: true },
  },
})

// Cookie-backed browser client used only for sending email OTPs (see AuthCard).
// NOTE: this stores its session in cookies, while `supabase` above stores in localStorage —
// they are not automatically in sync. verifyOtp/passkey sign-in intentionally use the
// `supabase` client above so the resulting session lands where the rest of the app expects it.
// detectSessionInUrl is off for the same reason as above — this client is only ever used to
// send OTP emails, it should never race to auto-consume a URL it has no business reading.
export const supabaseAuthClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: { detectSessionInUrl: false },
})

// Shared by every sign-in path (OTP, passkey, Google) so role routing can't
// drift between them — proxy.ts gates /home and /org-home on this cookie,
// without it the request never reaches the page and bounces back through
// /login, landing the user back on the marketing page instead of their home feed.
export function destinationForUserType(userType?: string): { role: "volunteer" | "org"; home: string } {
  return userType === "organization"
    ? { role: "org", home: "/org-home" }
    : { role: "volunteer", home: "/home" }
}

export function applyRoleSession(role: "volunteer" | "org") {
  document.cookie = `kindly_role=${role}; path=/; max-age=604800; SameSite=Lax`
}