"use client"

import { UserPlus, Search, CalendarCheck } from "lucide-react"
import { ScrollReveal } from "@/components/ui/scroll-reveal"

export function HowItWorksSection() {
  return (
    // Boosted vertical padding for mobile (py-16)
    <section className="bg-gradient-to-b from-[#f0fdf4] dark:from-black to-[#ecfdf5] dark:to-black py-20 md:py-32">
      <div className="max-w-5xl mx-auto px-6 md:px-8">

        <ScrollReveal className="text-center mb-12 md:mb-20">
          {/* Subtitle: 12px for mobile readability */}
          <p className="text-[#059669] text-[12px] md:text-sm font-medium mb-1 md:mb-2 uppercase tracking-wide">How It Works</p>
          {/* Header: 28px for mobile prominence */}
          <h2 className="text-[28px] md:text-[56px] font-semibold text-foreground dark:text-white tracking-tight leading-tight">
            Start in
            <br />
            three simple steps.
          </h2>
        </ScrollReveal>

        {/* Grid: 1 column on mobile (Stacked), 3 columns on desktop. Added gap-12 for spacing between steps */}
        <ScrollReveal delay={0.15} className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-12">

          {/* Step 1 */}
          <div className="relative">
            <div className="flex flex-col items-center text-center">
              {/* Icon Box: Increased to w-16 on mobile so it doesn't look tiny while stacked */}
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-card dark:bg-neutral-900/40 dark:backdrop-blur-md dark:border dark:border-white/5 shadow-xl shadow-[#059669]/10 dark:shadow-black/50 flex items-center justify-center mb-4 md:mb-6 relative">
                <UserPlus className="w-8 h-8 md:w-10 md:h-10 text-[#059669]" />
                <span className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 w-6 h-6 md:w-7 md:h-7 bg-[#059669] text-white text-[12px] md:text-sm font-semibold rounded-full flex items-center justify-center">
                  1
                </span>
              </div>
              <h3 className="text-[18px] md:text-[24px] font-semibold text-foreground dark:text-white mb-2 md:mb-3">Create Profile</h3>
              <p className="text-[14px] md:text-[17px] text-muted-foreground dark:text-neutral-400 leading-relaxed max-w-[200px] md:max-w-none">
                Sign up and share your interests.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-card dark:bg-neutral-900/40 dark:backdrop-blur-md dark:border dark:border-white/5 shadow-xl shadow-[#059669]/10 dark:shadow-black/50 flex items-center justify-center mb-4 md:mb-6 relative">
                <Search className="w-8 h-8 md:w-10 md:h-10 text-[#059669]" />
                <span className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 w-6 h-6 md:w-7 md:h-7 bg-[#059669] text-white text-[12px] md:text-sm font-semibold rounded-full flex items-center justify-center">
                  2
                </span>
              </div>
              <h3 className="text-[18px] md:text-[24px] font-semibold text-foreground dark:text-white mb-2 md:mb-3">Find Events</h3>
              <p className="text-[14px] md:text-[17px] text-muted-foreground dark:text-neutral-400 leading-relaxed max-w-[200px] md:max-w-none">
                Browse matching opportunities.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-card dark:bg-neutral-900/40 dark:backdrop-blur-md dark:border dark:border-white/5 shadow-xl shadow-[#059669]/10 dark:shadow-black/50 flex items-center justify-center mb-4 md:mb-6 relative">
                <CalendarCheck className="w-8 h-8 md:w-10 md:h-10 text-[#059669]" />
                <span className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 w-6 h-6 md:w-7 md:h-7 bg-[#059669] text-white text-[12px] md:text-sm font-semibold rounded-full flex items-center justify-center">
                  3
                </span>
              </div>
              <h3 className="text-[18px] md:text-[24px] font-semibold text-foreground dark:text-white mb-2 md:mb-3">Make Impact</h3>
              <p className="text-[14px] md:text-[17px] text-muted-foreground dark:text-neutral-400 leading-relaxed max-w-[200px] md:max-w-none">
                Show up and make a difference.
              </p>
            </div>
          </div>

        </ScrollReveal>
      </div>
    </section>
  )
}