"use client"

import { useEffect } from "react"
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
 * Two panels sweep up from the bottom (cream then KINDLY red), the logo
 * springs in, then `onDone` fires so the caller can navigate.
 *
 * Timing (default 1400ms):
 *   0ms   – cream panel starts wiping up  (600ms)
 *   100ms – red panel starts wiping up    (700ms, done at 800ms)
 *   600ms – logo fades + scales in        (~700ms spring, done ~1100ms)
 *   1400ms – onDone fires → navigation
 */
export function BrandSplash({ show, onDone, duration = 1400 }: BrandSplashProps) {
  useEffect(() => {
    if (!show) return
    const t = setTimeout(onDone, duration)
    return () => clearTimeout(t)
  }, [show, onDone, duration])

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[100] pointer-events-none">
          {/* Layer 1 — cream wipe */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
            className="absolute inset-0 bg-[#F5F5DC]"
          />

          {/* Layer 2 — brand red wipe + logo */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ delay: 0.1, duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
            className="absolute inset-0 bg-[#80242a] flex items-center justify-center"
          >
            <motion.img
              src="/logo-light.png"
              alt="KINDLY"
              initial={{ opacity: 0, scale: 0.7, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ delay: 0.5, duration: 0.7, type: "spring", bounce: 0.4 }}
              className="w-48 object-contain"
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
