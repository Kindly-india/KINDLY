"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  /** Stagger delay in seconds, for sequencing multiple reveals in a list. */
  delay?: number
}

/**
 * Fades a section/card in and lifts it slightly (y: 20 -> 0) as it enters
 * the viewport. Reusable across page-level sections and Bento cells —
 * `viewport: { once: true }` so it doesn't replay on every scroll pass.
 */
export function ScrollReveal({ children, className, delay = 0 }: ScrollRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
