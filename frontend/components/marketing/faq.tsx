"use client"

import { useId, useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FaqItem {
  q: string
  a: string
}

/** Keyboard-accessible accordion (aria-expanded / aria-controls) with a smooth height transition. */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0)
  const base = useId()
  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
      {items.map((it, i) => {
        const isOpen = open === i
        const btn = `${base}-b${i}`
        const panel = `${base}-p${i}`
        return (
          <div key={it.q}>
            <h3>
              <button
                id={btn}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panel}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left text-[16px] font-semibold text-foreground transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-foreground/40 sm:px-6"
              >
                <span>{it.q}</span>
                <ChevronDown className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")} aria-hidden />
              </button>
            </h3>
            <div id={panel} role="region" aria-labelledby={btn} aria-hidden={!isOpen} className={cn("grid transition-[grid-template-rows] duration-300 ease-out", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
              <div className="overflow-hidden">
                <p className="px-5 pb-6 text-[15px] leading-relaxed text-muted-foreground sm:px-6">{it.a}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
