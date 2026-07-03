import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes accessible only by volunteers
const VOLUNTEER_ONLY = [
  '/home',
  '/history',
  '/volunteer-impact',
  '/notifications',
]

// Routes accessible only by organizations
const ORG_ONLY = [
  '/org-home',
  '/org-analytics',
  '/org-events',
  '/edit-event',
]

// Admin routes just require *some* signed-in session at this layer — the
// real is_admin check can't be done cheaply at the edge (it's a DB column,
// not a JWT claim), so it's enforced by the backend's AdminGuard and by a
// client-side redirect on 401/403 in the admin page itself. This just keeps
// fully anonymous visitors from loading the page shell at all.
const ADMIN_ONLY = [
  '/admin',
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const role = request.cookies.get('kindly_role')?.value // 'volunteer' | 'org' | undefined

  const isVolunteerOnly = VOLUNTEER_ONLY.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
  const isOrgOnly = ORG_ONLY.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
  const isAdminOnly = ADMIN_ONLY.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )

  // Not a protected route — pass through
  if (!isVolunteerOnly && !isOrgOnly && !isAdminOnly) {
    return NextResponse.next()
  }

  // No role cookie: unauthenticated or pre-cookie session — send to login
  if (!role) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Org user trying to access volunteer area
  if (role === 'org' && isVolunteerOnly) {
    return NextResponse.redirect(new URL('/org-home', request.url))
  }

  // Volunteer trying to access org area
  if (role === 'volunteer' && isOrgOnly) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/home',
    '/history',
    '/volunteer-impact',
    '/notifications',
    '/org-home',
    '/org-analytics',
    '/org-events/:path*',
    '/admin/:path*',
    '/edit-event/:path*',
  ],
}
