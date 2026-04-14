"use client"

import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { TopNav } from "./top-nav"
import { VolunteerMobileNav } from "./volunteer-mobile-nav"
import { OrgMobileNav } from "./org-mobile-nav"

export function NavbarManager() {
  const pathname = usePathname()
  const [userType, setUserType] = useState<'volunteer' | 'org' | null>(null)

  // 1. Ask the backend: "Who is this?"
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

  // 2. Hide Navbars entirely on Landing, Login, Signup, and Static Content
  const isStaticOrAuth = 
    pathname === "/" || 
    pathname === "/login" || 
    pathname === "/signup" ||
    pathname.startsWith("/company") ||
    pathname.startsWith("/resources") ||
    pathname.startsWith("/how-it-works") ||
    pathname.startsWith("/for-")

  if (isStaticOrAuth) return null

  // 3. Fallback logic: Match YOUR exact folder structure (/org-home, /org-events, etc.)
  const isOrgRoute = pathname.startsWith('/org-') || pathname.startsWith('/organizations')

  // The ultimate decision: Show Org nav if API says they are an org, 
  // OR if API hasn't loaded yet but the URL strongly suggests they are an org.
  const showOrgNav = userType === 'org' || (userType === null && isOrgRoute)

  return (
    <>
      {/* Show TopNav ONLY for Volunteers */}
      {!showOrgNav && <TopNav />}

      {/* Switch Bottom Navs based on true identity */}
      {showOrgNav ? <OrgMobileNav /> : <VolunteerMobileNav />}
    </>
  )
}