"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { NAV_LINKS } from "@/lib/marketing-content"
import { cn } from "@/lib/utils"
import { Container, ctaPrimary } from "./primitives"

/** Fixed site header for the public marketing pages (the app's own nav is hidden on these routes). */
export function MarketingHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])
  useEffect(() => setOpen(false), [pathname])

  return (
    <header className={cn("fixed inset-x-0 top-0 z-40 border-b transition-colors duration-300", scrolled || open ? "border-border bg-background/85 backdrop-blur-xl" : "border-transparent bg-transparent")}>
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link href="/" aria-label="KINDLY home" className="shrink-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40">
          <Image src="/logo.png" alt="KINDLY" width={1882} height={440} priority className="h-6 w-auto dark:hidden" />
          <Image src="/logowhite.png" alt="KINDLY" width={1882} height={440} priority className="hidden h-6 w-auto dark:block" />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => {
            const active = pathname === l.href
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn("rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40", active ? "bg-muted text-foreground" : "text-muted-foreground")}
              >
                {l.label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40">Log in</Link>
          <Link href="/signup" className={cn(ctaPrimary, "h-10 px-5 text-sm")}>Get started</Link>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
          className="flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </Container>

      {open && (
        <div id="mobile-nav" className="border-t border-border bg-background md:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} aria-current={pathname === l.href ? "page" : undefined} className="rounded-xl px-3 py-3 text-base font-medium text-foreground hover:bg-muted">
                {l.label}
              </Link>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Link href="/login" className="flex h-12 items-center justify-center rounded-full border border-border text-[15px] font-semibold text-foreground">Log in</Link>
              <Link href="/signup" className={ctaPrimary}>Get started</Link>
            </div>
          </Container>
        </div>
      )}
    </header>
  )
}
