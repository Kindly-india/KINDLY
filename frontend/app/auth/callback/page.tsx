"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function AuthCallbackPage() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const code = params.get("code")
    const next = params.get("next") ?? "/onboarding"

    if (!code) {
      router.replace("/")
      return
    }

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        console.error("Auth callback error:", error.message)
        router.replace("/")
      } else {
        router.replace(next)
      }
    })
  }, [params, router])

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#80242a] border-t-transparent animate-spin" />
    </div>
  )
}
