"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 data-[state=checked]:bg-[#ff6b6b] data-[state=checked]:border-[#ff6b6b] focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklch,var(--primary)_50%,transparent)] aria-invalid:ring-2 aria-invalid:ring-[color-mix(in_oklch,var(--destructive)_50%,transparent)] size-4 shrink-0 rounded-md shadow-none transition-colors outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-white transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
