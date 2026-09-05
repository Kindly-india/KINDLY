import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Keep in sync with MAX_FILE_SIZE_MB in backend/src/common/file-validation.util.ts,
// and with the per-bucket size limit configured in Supabase Storage.
// Keep in sync with MAX_OVERNIGHT_HOURS in backend/src/common/hours.util.ts.
// An end time before the start means the event runs past midnight (eventHours
// wraps it); this bounds the wrap so a typo can't claim 23 hours of impact.
export const MAX_OVERNIGHT_HOURS = 12

export const MAX_UPLOAD_MB = 25
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024

/** "art_culture" -> "Art Culture" — clean display label for raw category/tag slugs. */
export function formatLabel(raw: string): string {
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

// ─────────────────────────────────────────────────────────────────────────────
// HOURS — single source of truth for the frontend.
//
// eventHours() MUST stay in sync with backend/src/common/hours.util.ts and the
// update_volunteer_hours_on_checkin SQL trigger. Any client-side hours math must
// go through it — never re-implement the (end - start) formula inline.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Canonical per-event duration in hours: wall-clock (end - start), overnight-aware
 * (end < start => +24h), fractional, rounded to 2 decimals.
 * "09:00","13:30" -> 4.5 ; "22:00","01:00" -> 3 ; missing/invalid -> 0.
 */
export function eventHours(startTime?: string | null, endTime?: string | null): number {
  if (!startTime || !endTime) return 0
  const [sh, sm] = startTime.split(":").map(Number)
  const [eh, em] = endTime.split(":").map(Number)
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0
  let minutes = eh * 60 + em - (sh * 60 + sm)
  if (minutes < 0) minutes += 24 * 60 // event crosses midnight
  return Math.round((minutes / 60) * 100) / 100 // 2 dp
}

/**
 * Personal, per-event style hours as "Xh Ym" — reads naturally for the small
 * values a single event produces. 1.25 -> "1h 15m", 4 -> "4h", 0.5 -> "30m",
 * 0/undefined -> "0h". Includes its own unit, so don't add "hrs" after it.
 */
export function formatHours(hours: number | null | undefined): string {
  const h = Number(hours) || 0
  if (h <= 0) return "0h"
  const totalMinutes = Math.round(h * 60)
  const hh = Math.floor(totalMinutes / 60)
  const mm = totalMinutes % 60
  if (hh === 0) return `${mm}m`
  if (mm === 0) return `${hh}h`
  return `${hh}h ${mm}m`
}

/**
 * Aggregate / cumulative-total hours as a rounded whole number with thousands
 * separators and NO unit — for values that can grow large (a volunteer's lifetime
 * total, org man-hours, platform totals): 1234.56 -> "1,235". The caller keeps its
 * own "hrs"/"Hours" label so existing copy stays intact.
 */
export function formatHoursTotal(hours: number | null | undefined): string {
  const h = Number(hours) || 0
  return Math.round(h).toLocaleString("en-IN")
}

/**
 * CSS object-position for a cover image given an optional stored focal point
 * (0-100 percentages, from events.cover_focal_x/y). Falls back to dead-center
 * — the crop every cover image rendered with before focal points existed —
 * so events without a saved focal point are pixel-identical to today.
 */
export function coverObjectPosition(
  focalX?: number | null,
  focalY?: number | null
): string {
  const x = typeof focalX === "number" && Number.isFinite(focalX) ? Math.min(100, Math.max(0, focalX)) : 50
  const y = typeof focalY === "number" && Number.isFinite(focalY) ? Math.min(100, Math.max(0, focalY)) : 50
  return `${x}% ${y}%`
}

/**
 * Fetches a URL as a blob and triggers a browser download dialog.
 * Works on iOS Safari (unlike window.open which just opens a new tab).
 */
export async function downloadFromUrl(url: string, filename = 'download.pdf'): Promise<void> {
  const response = await fetch(url)
  const blob = await response.blob()
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(blobUrl)
}
