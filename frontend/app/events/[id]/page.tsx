import type { Metadata } from "next"
import EventDetailsPage from "@/components/event-details-page"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kindly.co.in'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params

  try {
    const res = await fetch(`${API_URL}/events/details/${id}`, { next: { revalidate: 60 } })
    if (!res.ok) return {}
    const { event } = await res.json()

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

    const image = event.cover_image_url || DEFAULT_OG_IMAGE

    return {
      title,
      description,
      openGraph: {
        type: 'website',
        siteName: 'KINDLY',
        title,
        description,
        url: `${SITE_URL}/events/${id}`,
        images: [{ url: image, width: 1200, height: 630, alt: title }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [image],
      },
    }
  } catch {
    return {}
  }
}

export default function EventDetailRoute() {
  return <EventDetailsPage />
}
