import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium tracking-tight transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklch,var(--primary)_50%,transparent)] aria-invalid:ring-2 aria-invalid:ring-[color-mix(in_oklch,var(--destructive)_50%,transparent)]",
  {
    variants: {
      variant: {
        // Primary: clean, distinct solid control — white-on-black in dark mode.
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-white dark:text-black dark:hover:bg-neutral-200 hover:scale-[1.015] hover:-translate-y-0.5 transition-all duration-300 ease-out",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-[color-mix(in_oklch,var(--destructive)_50%,transparent)] dark:bg-destructive/60",
        // Secondary: frosted, thin-bordered glass.
        outline:
          "border border-black/10 dark:border-white/10 bg-background/80 backdrop-blur-md hover:bg-black/5 dark:hover:bg-white/5 hover:scale-[1.015] hover:-translate-y-0.5 transition-all duration-300 ease-out",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-black/5 dark:hover:bg-white/5",
        link: "text-primary underline-offset-4 hover:underline",
        "nav-pill":
          "rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-5 dark:bg-white dark:text-black dark:hover:bg-neutral-200 hover:scale-[1.015] hover:-translate-y-0.5 transition-all duration-300 ease-out",
        "outline-pill":
          "rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-md text-foreground hover:bg-black/10 dark:hover:bg-white/10 px-5 hover:scale-[1.015] hover:-translate-y-0.5 transition-all duration-300 ease-out",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-lg gap-2 px-3 has-[>svg]:px-3",
        lg: "h-12 px-6 has-[>svg]:px-4",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
