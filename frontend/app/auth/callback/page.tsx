"use client"

import { Suspense, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase, destinationForUserType, applyRoleSession } from "@/lib/supabase"
import { api } from "@/lib/api"

function AuthCallbackLogic() {
  const router = useRouter()
  const params = useSearchParams()
  // React Strict Mode (on by default in `next dev`) double-invokes effects,
  // which would call exchangeCodeForSession twice — the PKCE code_verifier
  // is single-use, so the second call fails with "code verifier not found
  // in storage". This guard makes sure the exchange only ever runs once
  // per real mount.
  const hasRun = useRef(false)

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
        router.replace(home)
        return
      }

      const profileRes = await api.getUserProfile().catch(() => null)
      if (profileRes?.profile) {
        router.replace(home)
        return
      }

      // Brand-new volunteer via Google — no volunteer_profiles row yet.
      // Google already gave us a real name, so skip the manual name-capture
      // step and use it directly.
      const googleName = user?.user_metadata?.full_name || user?.user_metadata?.name || ""
      await api.ensureVolunteerProfile(googleName).catch(() => {})
      await api.sendWelcomeEmail().catch(() => {})
      router.replace("/onboarding")
    })
  }, [params, router])

  return (
    <div className="fixed inset-0 bg-card flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#80242a] border-t-transparent animate-spin" />
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-card flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#80242a] border-t-transparent animate-spin" />
        </div>
      }
    >
      <AuthCallbackLogic />
    </Suspense>
  )
}
