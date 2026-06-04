import type { Metadata } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kindly.co.in'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`

type Props = {
  params: Promise<{ id: string }>
  children: React.ReactNode
}

// Three-tier fetch — fastest/most-reliable first:
//  1. Supabase service role key (server-only, bypasses RLS, no cold start)
//  2. Supabase anon key
//  3. Render backend as last resort
async function fetchOrgForMeta(id: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (supabaseUrl) {
    const keys = [
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ].filter(Boolean) as string[]

    for (const key of keys) {
      try {
        const res = await fetch(
          `${supabaseUrl}/rest/v1/organization_profiles?id=eq.${id}&select=name,tagline,mission_statement,area_locality,cover_url,logo_url&limit=1`,
          {
            headers: {
              apikey: key,
              Authorization: `Bearer ${key}`,
              Accept: 'application/json',
            },
            next: { revalidate: 60 },
          }
        )
        if (res.ok) {
          const rows = await res.json()
          if (rows?.[0]) return rows[0]
        }
      } catch { /* try next */ }
    }
  }

  const apiUrl = process.env.API_URL
    ?? process.env.NEXT_PUBLIC_API_URL
    ?? 'https://kindly-2ggv.onrender.com'
  try {
    const res = await fetch(`${apiUrl}/organizations/${id}/profile`, { next: { revalidate: 60 } })
    if (!res.ok) return null
    const { profile } = await res.json()
    return profile ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const profile = await fetchOrgForMeta(id)
  if (!profile) return {}

  const name = profile.name ?? 'Organization'
  const title = `${name} — Verified Organization on KINDLY`

  const description =
    profile.tagline
    ?? (profile.mission_statement ? profile.mission_statement.slice(0, 150) : null)
    ?? (profile.area_locality ? `Volunteer organization in ${profile.area_locality}` : null)
    ?? 'Verified volunteer organization on KINDLY'

  const rawImage = profile.cover_url || profile.logo_url
  const image = rawImage
    ? `${SITE_URL}/_next/image?url=${encodeURIComponent(rawImage)}&w=1200&q=75`
    : DEFAULT_OG_IMAGE

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      siteName: 'KINDLY',
      title,
      description,
      url: `${SITE_URL}/organizations/${id}`,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

export default function OrgProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
