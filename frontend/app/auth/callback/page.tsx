"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase, destinationForUserType, applyRoleSession } from "@/lib/supabase"
import { api } from "@/lib/api"
import { BrandSplash } from "@/components/brand-splash"
import { POST_AUTH_SPLASH_EVENT } from "@/components/post-auth-splash-bridge"

function AuthCallbackLogic() {
  const router = useRouter()
  const params = useSearchParams()
  // React Strict Mode (on by default in `next dev`) double-invokes effects,
  // which would call exchangeCodeForSession twice — the PKCE code_verifier
  // is single-use, so the second call fails with "code verifier not found
  // in storage". This guard makes sure the exchange only ever runs once
  // per real mount.
  const hasRun = useRef(false)

  // The brand splash plays IMMEDIATELY on landing here, while the code exchange
  // + profile lookup run underneath it. We navigate only once BOTH are done:
  //   - splashDone: the splash animation has finished
  //   - destination: the async work has decided where to send the user
  // This gives sign-in -> splash -> home (loading if still needed), instead of
  // the old sign-in -> loading spinner -> splash -> loading again -> home.
  const [splashDone, setSplashDone] = useState(false)
  const [destination, setDestination] = useState<string | null>(null)
  const onSplashDone = useCallback(() => setSplashDone(true), [])

  // Navigate when the splash has played AND we know where to go. If the async
  // work is slower than the splash, the splash simply stays on screen until
  // the destination resolves (no blank flash).
  //
  // This page's own <BrandSplash> is about to unmount the instant router.replace
  // fires (hard-navigated page, whole tree tears down) — right as the destination
  // page mounts. Firing this event hands off to the root-layout-level bridge
  // *before* that happens, so there's no gap for the destination's real content
  // to flash through.
  useEffect(() => {
    if (splashDone && destination) {
      window.dispatchEvent(new Event(POST_AUTH_SPLASH_EVENT))
      router.replace(destination)
    }
  }, [splashDone, destination, router])

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const code = params.get("code")

    if (!code) {
      router.replace("/")
      return
    }

    supabase.auth.exchangeCodeForSession(code).then(async ({ data, error }) => {
      if (error) {
        console.error("Auth callback error:", error.message)
        router.replace("/")
        return
      }

      const user = data.session?.user
      const { role, home } = destinationForUserType(user?.user_metadata?.user_type)
      applyRoleSession(role)

      // Org accounts are never created through this flow (Google only ever
      // signs a brand-new person up as a volunteer) — an "organization"
      // user_type here means an already-approved org signing back in.
      if (role === "org") {
        setDestination(home)
        return
      }

      const profileRes = await api.getUserProfile().catch(() => null)
      if (profileRes?.profile) {
        setDestination(home)
        return
      }

      // Brand-new volunteer via Google — no volunteer_profiles row yet.
      // Google already gave us a real name, so skip the manual name-capture
      // step and use it directly.
      const googleName = user?.user_metadata?.full_name || user?.user_metadata?.name || ""
      await api.ensureVolunteerProfile(googleName).catch(() => {})
      await api.sendWelcomeEmail().catch(() => {})
      setDestination("/onboarding")
    })
  }, [params, router])

  return (
    <>
      {/* Plain brand background under the splash — no spinner, so nothing reads
          as "loading" before the splash wipes up. */}
      <div className="fixed inset-0 bg-card" />
      <BrandSplash show onDone={onSplashDone} />
    </>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-card" />}>
      <AuthCallbackLogic />
    </Suspense>
  )
}
