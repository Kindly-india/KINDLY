import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { MobileNav } from "@/components/mobile-nav"
import { TopNav } from "@/components/top-nav"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: {
    default: "KINDLY | Make a Real Impact",
    template: "%s | KINDLY",
  },
  description: "Bridge the gap between intention and action. Connect with verified community organizations, discover local volunteering events, and build your digital impact resume.",
  generator: "Next.js",
  applicationName: "KINDLY",
  keywords: ["volunteering", "community organizations", "NGO", "social impact", "community service", "Nashik", "KINDLY"],
  authors: [{ name: "KINDLY Team" }],
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // This ensures the viewport doesn't shrink weirdly in Chrome
  viewportFit: "cover", 
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable}>
      {/* Change: Add 'flex flex-col min-h-screen' to the body. 
         This forces the body to at least be the size of the phone screen, 
         which helps the browser understand that there is content to scroll through.
      */}
      <body className="font-sans antialiased flex flex-col min-h-screen">
        <TopNav />
        {/* Wrap children in a div that grows to fill the space */}
        <main className="flex-1 w-full">
          {children}
        </main>
        <MobileNav />
        <Analytics />
      </body>
    </html>
  )
}
