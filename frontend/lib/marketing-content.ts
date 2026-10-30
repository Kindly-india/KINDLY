// Single source of truth for facts and navigation shared by the public marketing pages.

/** Real platform figures supplied by the product owner. Update here (and the date) when they change. */
export const STATS = {
  volunteers: 232,
  organisations: 14,
  hours: 101,
  asOf: "October 2026",
} as const

export const CONTACT_EMAIL = "team@kindly.co.in"

export const NAV_LINKS = [
  { href: "/for-organisations", label: "For organisations" },
  { href: "/for-volunteers", label: "For volunteers" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/company/about", label: "About" },
] as const

export const FOOTER_LINKS = {
  Product: [
    { href: "/for-organisations", label: "For organisations" },
    { href: "/for-volunteers", label: "For volunteers" },
    { href: "/how-it-works", label: "How it works" },
    { href: "/events", label: "Browse events" },
  ],
  Company: [
    { href: "/company/about", label: "About" },
    { href: "/company/careers", label: "Careers" },
    { href: "/company/press", label: "Press" },
  ],
  Resources: [
    { href: "/resources/help-center", label: "Help centre" },
    { href: "/resources/blog", label: "Blog" },
    { href: "/resources/community", label: "Community" },
    { href: "/resources/feedback", label: "Feedback" },
  ],
  Legal: [
    { href: "/legal/terms", label: "Terms of use" },
    { href: "/legal/privacy", label: "Privacy policy" },
    { href: "/legal/cookies", label: "Cookie policy" },
  ],
} as const
