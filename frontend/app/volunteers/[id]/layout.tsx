import type { Metadata } from "next"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kindly.co.in'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`

type Props = {
  params: Promise<{ id: string }>
  children: React.ReactNode
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params

  try {
    const res = await fetch(`${API_URL}/volunteers/${id}/profile`, { next: { revalidate: 60 } })
    if (!res.ok) return {}
    const { profile } = await res.json()

    const name = profile.full_name ?? 'A Volunteer'
    const title = `${name} on KINDLY`

    let description: string
    let image: string

    if (profile.is_private) {
      description = 'Volunteer on KINDLY'
      image = DEFAULT_OG_IMAGE
    } else {
      const headline = profile.headline
        ? profile.headline
        : profile.city
          ? `Volunteer in ${profile.city}`
          : 'Volunteer on KINDLY'
      const hours = profile.total_hours
        ? ` ${profile.total_hours} hours contributed.`
        : ''
      description = `${headline}.${hours}`
      image = profile.avatar_url || profile.cover_url || DEFAULT_OG_IMAGE
    }

    return {
      title,
      description,
      openGraph: {
        type: 'website',
        siteName: 'KINDLY',
        title,
        description,
        url: `${SITE_URL}/volunteers/${id}`,
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

export default function VolunteerProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
