"use client"

import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"

import { TopNav } from "./top-nav"
import { OrgTopNav } from "./org-top-nav"
import { VolunteerMobileNav } from "./volunteer-mobile-nav"
import { OrgMobileNav } from "./org-mobile-nav"

export function NavbarManager() {
  const pathname = usePathname()
  const [userType, setUserType] = useState<'volunteer' | 'org' | null>(null)

  // 1. Check who is logged in
  useEffect(() => {
    const fetchRole = async () => {
      try {
        const res = await api.getUserProfile()
        if (res?.profile && 'org_type' in res.profile) {
          setUserType('org')
        } else {
          setUserType('volunteer')
        }
      } catch (e) {
        // Not logged in yet
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