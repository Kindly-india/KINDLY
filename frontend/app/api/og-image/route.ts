import { NextRequest } from 'next/server'

export const runtime = 'edge'

// Only proxy images from our own Supabase project — prevents SSRF abuse
const ALLOWED_HOSTNAME = 'ktdhcxgfbtbrszayrwuj.supabase.co'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kindly.co.in'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')

  if (!url) return Response.redirect(`${SITE_URL}/og-default.png`, 302)

  // Validate it's a URL from our Supabase project
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return Response.redirect(`${SITE_URL}/og-default.png`, 302)
  }

  if (parsed.hostname !== ALLOWED_HOSTNAME) {
    return Response.redirect(`${SITE_URL}/og-default.png`, 302)
  }

  try {
    const upstream = await fetch(url)
    if (!upstream.ok) return Response.redirect(`${SITE_URL}/og-default.png`, 302)

    const buffer = await upstream.arrayBuffer()

    // Serve with headers that social crawlers (WhatsApp, Telegram, etc.) accept:
    //   - No x-robots-tag (Supabase adds "none" which blocks crawlers)
    //   - Public long-lived cache (24h at CDN, 7-day stale-while-revalidate)
    return new Response(buffer, {
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    })
  } catch {
    return Response.redirect(`${SITE_URL}/og-default.png`, 302)
  }
}
