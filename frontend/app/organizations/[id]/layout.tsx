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
    const res = await fetch(`${API_URL}/organizations/${id}/profile`, { next: { revalidate: 60 } })
    if (!res.ok) return {}
    const { profile } = await res.json()

    const name = profile.name ?? 'Organization'
    const title = `${name} — Verified Organization on KINDLY`

    const description = profile.tagline
      || (profile.mission_statement ? profile.mission_statement.slice(0, 150) : null)
      || (profile.area_locality ? `Volunteer organization in ${profile.area_locality}` : null)
      || 'Verified volunteer organization on KINDLY'

    const image = profile.cover_url || profile.logo_url || DEFAULT_OG_IMAGE

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
  } catch {
    return {}
  }
}

export default function OrgProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
