import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

// WhatsApp-optimal: 1200×630
const W = 1200
const H = 630

// Only rasterize images from our own Supabase project — prevents SSRF abuse
// via an attacker-controlled `img` param (same pattern as /api/og-image).
const ALLOWED_HOSTNAME = 'ktdhcxgfbtbrszayrwuj.supabase.co'

function safeImageUrl(raw: string): string {
  if (!raw) return ''
  try {
    const parsed = new URL(raw)
    return parsed.hostname === ALLOWED_HOSTNAME ? raw : ''
  } catch {
    return ''
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get('title') || 'KINDLY Event'
  const img   = safeImageUrl(searchParams.get('img') || '')
  const org   = searchParams.get('org')   || ''
  const date  = searchParams.get('date')  || ''
  const loc   = searchParams.get('loc')   || ''

  // Font size scales down for long titles
  const titleSize = title.length > 55 ? 44 : title.length > 35 ? 52 : 62

  return new ImageResponse(
    (
      <div
        style={{
          width: `${W}px`,
          height: `${H}px`,
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          // Fallback bg when no cover image
          background: 'linear-gradient(135deg, #064e3b 0%, #0f172a 55%, #1e3a5f 100%)',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        {/* ── Cover image (full-bleed) ── */}
        {img ? (
          <img
            src={img}
            width={W}
            height={H}
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : null}

        {/* ── Gradient overlay ── */}
        {/*   Transparent at top, heavy at bottom so text pops  */}
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background:
              'linear-gradient(180deg,' +
              'rgba(0,0,0,0.08) 0%,' +
              'rgba(0,0,0,0.22) 35%,' +
              'rgba(0,0,0,0.68) 62%,' +
              'rgba(0,0,0,0.93) 100%)',
            display: 'flex',
          }}
        />

        {/* ── Content layer ── */}
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '46px 68px',
          }}
        >
          {/* TOP ROW ─────────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

            {/* KINDLY wordmark */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '11px',
                  height: '11px',
                  borderRadius: '50%',
                  backgroundColor: '#34d399',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: '21px',
                  fontWeight: '900',
                  color: '#ffffff',
                  letterSpacing: '5px',
                }}
              >
                KINDLY
              </span>
            </div>

            {/* "Volunteer Event" badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '9px 20px',
                borderRadius: '100px',
                backgroundColor: 'rgba(52,211,153,0.18)',
                border: '1.5px solid rgba(52,211,153,0.45)',
              }}
            >
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#6ee7b7',
                  letterSpacing: '1.5px',
                }}
              >
                VOLUNTEER EVENT
              </span>
            </div>
          </div>

          {/* BOTTOM BLOCK ────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>

            {/* Event title */}
            <div
              style={{
                fontSize: `${titleSize}px`,
                fontWeight: '800',
                color: '#ffffff',
                lineHeight: 1.18,
                maxWidth: '980px',
                marginBottom: '20px',
                overflow: 'hidden',
                // approximate 2-line clamp via max-height
                maxHeight: `${titleSize * 1.18 * 2.1}px`,
              }}
            >
              {title}
            </div>

            {/* Date + Location */}
            {(date || loc) && (
              <div
                style={{
                  display: 'flex',
                  gap: '36px',
                  marginBottom: '18px',
                  alignItems: 'center',
                }}
              >
                {date ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      fontSize: '21px',
                      fontWeight: '500',
                      color: 'rgba(255,255,255,0.82)',
                    }}
                  >
                    <span>📅</span>
                    <span>{date}</span>
                  </div>
                ) : null}
                {loc ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      fontSize: '21px',
                      fontWeight: '500',
                      color: 'rgba(255,255,255,0.82)',
                    }}
                  >
                    <span>📍</span>
                    <span>{loc}</span>
                  </div>
                ) : null}
              </div>
            )}

            {/* Org name + kindly.co.in */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {org ? (
                <span
                  style={{
                    fontSize: '19px',
                    fontWeight: '500',
                    color: 'rgba(255,255,255,0.50)',
                  }}
                >
                  by {org}
                </span>
              ) : <span />}

              <span
                style={{
                  fontSize: '17px',
                  fontWeight: '700',
                  color: '#34d399',
                  letterSpacing: '0.5px',
                }}
              >
                kindly.co.in
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    }
  )
}
