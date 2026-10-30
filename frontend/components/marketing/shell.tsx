import type { ReactNode } from "react"
import { MarketingFooter } from "./footer"
import { MarketingHeader } from "./header"

/**
 * Page chrome for the public marketing pages. The root layout wraps children in <main class="pb-20 md:pb-0">
 * (room for the app's bottom nav), so the negative margin keeps the footer flush on phones.
 */
export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="-mb-20 flex min-h-screen flex-col bg-background md:mb-0">
      <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-background">
        Skip to content
      </a>
      <MarketingHeader />
      <div id="content" className="flex-1 pt-16">{children}</div>
      <MarketingFooter />
    </div>
  )
}
