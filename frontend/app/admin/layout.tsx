"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { AdminHeader } from "@/components/admin/admin-header"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // No dedicated "am I admin" endpoint yet — reuse an existing AdminGuard
    // route purely as a gate check, same 401/403 redirect every admin page
    // used individually before this shared layout existed.
    api.getPendingOrgs()
      .catch((err: any) => {
        if (err?.status === 401 || err?.status === 403) {
          router.push("/")
        }
      })
      .finally(() => setLoading(false))
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted">
      <AdminHeader />
      {children}
    </div>
  )
}
