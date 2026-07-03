"use client"

import { Heart, Users, Globe, Sparkles } from "lucide-react"
import { ScrollReveal } from "@/components/ui/scroll-reveal"

export function AboutSection() {
  return (
    // Boosted vertical padding for mobile (py-16)
    <section id="about" className="bg-card dark:bg-black py-20 md:py-32 relative overflow-hidden">
      {/* Ambient side glow — this section's own dominant color (the blue
          "About" kicker accent), on the left to alternate with Impact's right. */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-[#0066cc]/[0.06] dark:bg-[#0066cc]/[0.12] rounded-full blur-3xl pointer-events-none"
      />

      <div className="max-w-5xl mx-auto px-6 md:px-8 relative">

        {/* Header */}
        <ScrollReveal className="text-center mb-10 md:mb-20">
          <p className="text-[#06c] text-[12px] md:text-sm font-medium mb-1 md:mb-2 uppercase tracking-wide">About</p>
          {/* Title: Bumped to 32px for mobile presence */}
          <h2 className="text-[32px] md:text-[56px] font-semibold text-foreground dark:text-white tracking-tight leading-tight">
            Volunteering.
            <br />
            Redefined.
          </h2>
        </ScrollReveal>

        {/* Mission Text: Bumped to 16px (standard mobile body size) */}
        <ScrollReveal delay={0.1}>
          <p className="text-[16px] md:text-[21px] text-foreground dark:text-neutral-300 text-center max-w-2xl mx-auto leading-relaxed mb-12 md:mb-20 px-2">
            We're on a mission to connect passionate people with organisations that are making real change. Every
            connection sparks a difference.
          </p>
        </ScrollReveal>

        {/* Grid: 2 columns mobile. Added gap-y-10 for vertical breathing room */}
        <ScrollReveal delay={0.2} className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10 md:gap-12">

          <div className="text-center">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-[#ff6b6b] to-[#ee5a5a] flex items-center justify-center mx-auto mb-3 md:mb-5 shadow-lg shadow-[#ff6b6b]/20">
              <Heart className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            {/* Header: Bumped to 16px */}
            <h3 className="text-[16px] md:text-[21px] font-semibold text-foreground dark:text-white mb-1.5 md:mb-2">Impact First</h3>
            {/* Description: Bumped to 13px */}
            <p className="text-[13px] md:text-[15px] text-muted-foreground dark:text-neutral-400 leading-relaxed px-1">
              Every hour creates lasting change.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-[#f59e0b] to-[#d97706] flex items-center justify-center mx-auto mb-3 md:mb-5 shadow-lg shadow-[#f59e0b]/20">
              <Users className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            <h3 className="text-[16px] md:text-[21px] font-semibold text-foreground dark:text-white mb-1.5 md:mb-2">Community Driven</h3>
            <p className="text-[13px] md:text-[15px] text-muted-foreground dark:text-neutral-400 leading-relaxed px-1">
              Join thousands building a better tomorrow.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center mx-auto mb-3 md:mb-5 shadow-lg shadow-[#10b981]/20">
              <Globe className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            <h3 className="text-[16px] md:text-[21px] font-semibold text-foreground dark:text-white mb-1.5 md:mb-2">Global Reach</h3>
            <p className="text-[13px] md:text-[15px] text-muted-foreground dark:text-neutral-400 leading-relaxed px-1">Find opportunities near or far.</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] flex items-center justify-center mx-auto mb-3 md:mb-5 shadow-lg shadow-[#8b5cf6]/20">
              <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            <h3 className="text-[16px] md:text-[21px] font-semibold text-foreground dark:text-white mb-1.5 md:mb-2">Spark Joy</h3>
            <p className="text-[13px] md:text-[15px] text-muted-foreground dark:text-neutral-400 leading-relaxed px-1">
              Experience the fulfillment of giving back.
            </p>
          </div>

        </ScrollReveal>
      </div>
    </section>
  )
}