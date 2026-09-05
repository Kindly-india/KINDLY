"use client"

import { useEffect } from "react"

// Scoped to <img> so right-click still works on text and links — only the
// browser's "Save image as…" / drag-to-save path is taken away.
export function ImageProtection() {
  useEffect(() => {
    const block = (e: Event) => {
      if (e.target instanceof HTMLImageElement) e.preventDefault()
    }
    document.addEventListener("contextmenu", block)
    document.addEventListener("dragstart", block)
    return () => {
      document.removeEventListener("contextmenu", block)
      document.removeEventListener("dragstart", block)
    }
  }, [])

  return null
}
