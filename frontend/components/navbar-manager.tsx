"use client"

import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"

import { TopNav } from "./top-nav"
import { OrgTopNav } from "./org-top-nav"
import { VolunteerMobileNav } from "./volunteer-mobile-nav"
import { OrgMobileNav } from "./org-mobile-nav"

// The kindly_role cookie is set at login (see applyRoleSession) and is readable
// synchronously — use it as the initial role so the bottom nav is correct on the
// very first paint. Without this, userType is null while getUserProfile() is in
// flight, and the route-based fallback below would flash the ORG nav (Analytics
// tab) to a volunteer viewing an /organizations/[id] page.
function roleFromCookie(): 'volunteer' | 'org' | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(/(?:^|;\s*)kindly_role=(volunteer|org)/)
  return m ? (m[1] as 'volunteer' | 'org') : null
}

export function NavbarManager() {
  const pathname = usePathname()
  const [userType, setUserType] = useState<'volunteer' | 'org' | null>(null)

  // Seed from the cookie on mount (can't read document during SSR).
  useEffect(() => {
    setUserType(roleFromCookie())
  }, [])

  // 1. Confirm who is logged in (source of truth; corrects a stale cookie).
  useEffect(() => {
    const fetchRole = async () => {
      try {
        const res = await api.getUserProfile()
        if (res?.profile && 'org_type' in res.profile) {
          setUserType('org')
        } else if (res?.profile) {
          setUserType('volunteer')
        }
      } catch (e) {
        // Not logged in yet — leave whatever the cookie said (or null)
      }
    }
    fetchRole()
  }, [])

  if (!pathname) return null

  // 2. Hide ALL navbars on Landing, Login, Signup, etc.
  // Also hide on pages that render their own full navbar.
  const isStaticOrAuth =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/company") ||
    pathname.startsWith("/resources") ||
    pathname.startsWith("/how-it-works") ||
    pathname.startsWith("/for-") ||
    pathname.startsWith("/legal") ||
    pathname === "/onboarding" ||
    pathname === "/org-signup"


  if (isStaticOrAuth) return null

  // 3. Determine if the user belongs to the Org portal
  const isOrgRoute = pathname.startsWith('/org-') || pathname.startsWith('/organizations')
  const isOrgUser = userType === 'org' || (userType === null && isOrgRoute)

  // 4. Individual post detail (/posts/[id]) is a full-bleed immersive view
  // with its own floating back/delete controls and fixed comment bar — like
  // opening a single post/story, it hides all shared chrome so the hero photo
  // can run edge-to-edge. Keep the shared nav on /posts/create and
  // /posts/select-event, which are normal flow pages.
  const isPostDetail = pathname.startsWith('/posts/') && pathname !== '/posts/create' && pathname !== '/posts/select-event'

  if (isPostDetail) return null

  return (
    <>
      {/* TOP NAV: OrgTopNav for Orgs, TopNav for Volunteers */}
      {isOrgUser ? <OrgTopNav /> : <TopNav />}

      {/* BOTTOM NAV: OrgMobileNav for Orgs, VolunteerMobileNav for Volunteers */}
      {isOrgUser ? <OrgMobileNav /> : <VolunteerMobileNav />}
    </>
  )
}