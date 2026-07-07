"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"

export const POST_AUTH_SPLASH_EVENT = "kindly:post-auth-splash"

/**
 * Bridges the OAuth hard-navigation boundary (Google -> /auth/callback ->
 * destination page) so the destination's real content never gets a chance to
 * flash into view before the brand transition has fully settled.
 *
 * /auth/callback's own <BrandSplash> plays its entrance animation and then
 * unmounts the instant router.replace(destination) fires — since that's a
 * hard-navigated page, its whole component tree (including the splash
 * portal) tears down right as the destination page mounts, leaving a gap.
 * Rendered once here in the root layout (which persists across a client-side
 * route change, unlike a page-local component), this picks up right where
 * that splash left off — already-settled black + logo, no re-entrance — and
 * holds until the new page is ready underneath, then fades away.
 */
export function PostAuthSplashBridge() {
  const [mounted, setMounted] = useState(false)
  const [active, setActive] = useState(false)

  useEffect(() => {
    setMounted(true)
    const onTrigger = () => {
      setActive(true)
      const t = setTimeout(() => setActive(false), 450)
      return () => clearTimeout(t)
    }
    window.addEventListener(POST_AUTH_SPLASH_EVENT, onTrigger)
    return () => window.removeEventListener(POST_AUTH_SPLASH_EVENT, onTrigger)
  }, [])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {active && (
        <motion.div
          data-testid="post-auth-splash-bridge"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center pointer-events-none overflow-hidden"
        >
          <div className="absolute w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <img src="/logowhite.png" alt="KINDLY" className="relative w-48 object-contain" />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
