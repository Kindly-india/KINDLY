// lucide-react's Instagram/Linkedin icons are deprecated (slated for removal),
// and lucide ships no WhatsApp glyph at all — hand-rolled outline SVGs here
// keep the same 24x24/stroke-2/currentColor style as the rest of the app's icons.
// Shared between volunteer-home-page.tsx and contact-section.tsx footers.
export function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <line x1="8" y1="10" x2="8" y2="16" />
      <circle cx="8" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
      <path d="M12 16v-3.5a2.5 2.5 0 0 1 5 0V16" />
      <line x1="12" y1="10" x2="12" y2="16" />
    </svg>
  )
}

export function WhatsappIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 21l1.5-4.5A8 8 0 1 1 8.5 19.5L3 21Z" />
      <path d="M8.5 9.5c0 3 2.5 5.5 5.5 5.5.5 0 1-.5 1-1v-1l-2-1-1 1a5 5 0 0 1-2.5-2.5l1-1-1-2h-1c-.5 0-1 .5-1 1Z" />
    </svg>
  )
}
