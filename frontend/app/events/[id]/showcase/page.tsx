import type { Metadata } from "next"
import ShowcaseClient from "./showcase-client"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kindly.co.in'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`

type Props = { params: Promise<{ id: string }> }

// Fetch event data for OG metadata — three-tier, fastest first:
//  1. Supabase service role key (server-only env var, bypasses RLS, no cold start)
//  2. Supabase anon key (works if events table has a public SELECT policy)
//  3. Render backend as last resort (may cold-start on free tier)
async function fetchEventForMeta(id: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (supabaseUrl) {
    const keys = [
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ].filter(Boolean) as string[]

    for (const key of keys) {
      try {
        const res = await fetch(
          `${supabaseUrl}/rest/v1/events?id=eq.${id}&select=title,cover_image_url,event_date,location,description,connect_plan,organization_profiles(name)&limit=1`,
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
    const res = await fetch(`${apiUrl}/events/details/${id}`, { next: { revalidate: 60 } })
    if (!res.ok) return null
    const { event } = await res.json()
    return event ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const event = await fetchEventForMeta(id)
  if (!event) return {}

  const orgName = event.organization_profiles?.name ?? 'KINDLY'
  const title = `${event.title} — ${orgName}`

  const dateStr = event.event_date
    ? new Date(event.event_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
    : ''
  const locationStr = event.location ?? ''
  const body = event.connect_plan
    ? event.connect_plan
    : (event.description ?? '').slice(0, 150)
  const description = [dateStr && `${dateStr}`, locationStr && `at ${locationStr}`, body]
    .filter(Boolean).join('. ')

  const ogImage = event.cover_image_url
    ? `${SITE_URL}/api/og-image?url=${encodeURIComponent(event.cover_image_url)}`
    : DEFAULT_OG_IMAGE

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      siteName: 'KINDLY',
      title,
      description,
      url: `${SITE_URL}/events/${id}/showcase`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default function ShowcasePage() {
  return <ShowcaseClient />
}
