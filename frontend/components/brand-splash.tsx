"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"

interface BrandSplashProps {
  show: boolean
  onDone: () => void
  /** Total ms before onDone fires. Default 1400. */
  duration?: number
}

/**
 * BrandSplash
 *
 * A full-screen brand wipe that plays on explicit login events.
 * Two panels sweep up from the bottom (neutral-900 then black, with an
 * indigo glow behind the logo — same palette as the rest of the redesign,
 * not the old maroon/beige one), the logo springs in, then `onDone` fires
 * so the caller can navigate. Always renders this way regardless of site
 * theme — it's a brand moment, not a themed surface.
 *
 * Timing (default 1400ms):
 *   0ms   – neutral-900 panel starts wiping up  (600ms)
 *   100ms – black panel starts wiping up        (700ms, done at 800ms)
 *   600ms – logo fades + scales in               (~700ms spring, done ~1100ms)
 *   1400ms – onDone fires → navigation
 */
export function BrandSplash({ show, onDone, duration = 1400 }: BrandSplashProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!show) return
    const t = setTimeout(onDone, duration)
    return () => clearTimeout(t)
  }, [show, onDone, duration])

  if (!mounted) return null

  // Portalled to <body> — a caller anywhere in the tree (e.g. AuthCard, which
  // sits inside a Card with backdrop-blur-xl) would otherwise have `fixed`
  // trapped inside that ancestor: `filter`/`backdrop-filter` establish a new
  // containing block per spec, so "fixed inset-0" resolves against the
  // nearest filtered ancestor instead of the viewport.
  return createPortal(
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[100] pointer-events-none">
          {/* Layer 1 — neutral-900 wipe */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
            className="absolute inset-0 bg-neutral-900"
          />

          {/* Layer 2 — black wipe + indigo glow + logo */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ delay: 0.1, duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
            className="absolute inset-0 bg-black flex items-center justify-center overflow-hidden"
          >
            <div className="absolute w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
            <motion.img
              src="/logowhite.png"
              alt="KINDLY"
              initial={{ opacity: 0, scale: 0.7, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ delay: 0.5, duration: 0.7, type: "spring", bounce: 0.4 }}
              className="relative w-48 object-contain"
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
