import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { NavbarManager } from "@/components/navbar-manager"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { PostAuthSplashBridge } from "@/components/post-auth-splash-bridge"


const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kindly.co.in'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`
const DEFAULT_TITLE = 'KINDLY — Volunteer with people, not just for causes'
const DEFAULT_DESCRIPTION = 'Find events near you. Show up. Make friends. Make a difference. Sundays in Nashik are for KINDLY.'

export const metadata: Metadata = {
  title: {
    default: DEFAULT_TITLE,
    template: "%s | KINDLY",
  },
  description: DEFAULT_DESCRIPTION,
  generator: "Next.js",
  applicationName: "KINDLY",
  keywords: ["volunteering", "community organizations", "NGO", "social impact", "community service", "Nashik", "KINDLY"],
  authors: [{ name: "KINDLY Team" }],
  icons: {
    // Single theme-aware SVG (embeds both light/dark renders, switches via
    // prefers-color-scheme internally) — one file instead of a PNG pair,
    // since SVG favicon support is now standard across all major browsers.
    icon: "/icon.svg",
    // Raster PNG is non-negotiable here: iOS home-screen icons require a
    // fixed-size bitmap, no SVG option exists for apple-touch-icon.
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "KINDLY",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: "KINDLY" }],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", 
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased flex flex-col min-h-screen bg-neutral-50 dark:bg-black text-foreground">
        <ThemeProvider>
          {/* No global ambient glow here — every page section paints its own
              opaque background, so a body-level glow sits behind all of them
              and never shows. Glows live inside the section that wants one
              instead (see volunteer-home-page.tsx's hero/footer glows). */}

          {/* The Traffic Cop: Decides which navbars to show */}
          <NavbarManager />
          <Toaster position="top-center" richColors theme="system" />
          <PostAuthSplashBridge />

          {/* pb-24 ensures space for the bottom navbars on mobile */}
          <main className="flex-1 w-full pb-20 md:pb-0">
            {children}
          </main>

          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}