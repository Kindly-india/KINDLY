import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-muted-foreground bg-black/5 dark:bg-white/5 flex field-sizing-content min-h-16 w-full rounded-xl border-0 px-4 py-3 text-base shadow-none transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklch,var(--primary)_50%,transparent)] aria-invalid:ring-2 aria-invalid:ring-[color-mix(in_oklch,var(--destructive)_50%,transparent)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
