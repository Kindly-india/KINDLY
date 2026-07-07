import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ONE client for the whole app. There used to be a second, cookie-backed
// client (createBrowserClient) that only sent OTP emails — but two GoTrueClient
// instances share the same storage key, and supabase-js serialises every auth
// operation under one navigator lock derived from that key. On the OAuth
// callback both instances booted and contended for the lock, which made Google
// sign-in fail intermittently ("first attempt fails, second works" — the second
// time the clients were warm). Collapsing to a single client removes that race
// entirely (and the "Multiple GoTrueClient instances" console warning). Nothing
// server-side reads the Supabase session cookie — proxy.ts gates on the custom
// kindly_role cookie and the backend uses bearer tokens — so cookie storage
// isn't needed.
//
// `experimental.passkey` opts into Supabase's beta Passkey/WebAuthn API.
// `flowType: 'pkce'` makes signInWithOAuth (Google) come back with a `?code=`
// query param that app/auth/callback exchanges.
// `detectSessionInUrl: false` stops the client from auto-consuming that `?code=`
// on construction, so the callback's explicit exchangeCodeForSession() is the
// only thing that ever touches the one-time PKCE code.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: false,
    experimental: { passkey: true },
  },
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
  // Secure only over HTTPS — a Secure cookie won't set on http://localhost, which
  // would break the proxy's role gate in local dev. So add it in production only.
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `kindly_role=${role}; path=/; max-age=604800; SameSite=Lax${secure}`
}