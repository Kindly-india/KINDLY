"use client"

import { MapPin, ChevronRight } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { InstagramIcon, LinkedinIcon, WhatsappIcon } from "@/components/ui/social-icons"
import { useRouter } from "next/navigation"

export function ContactSection() {
  const router = useRouter()

  // Smooth scroll handler
  const handleSignUpClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (window.location.pathname === '/' || window.location.pathname === '') {
      const heroSection = document.querySelector('#hero') || document.querySelector('main')
      if (heroSection) {
        heroSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else {
      router.push('/#hero')
    }
  }

  return (
    // This band is intentionally always-dark (brand footer), independent of the site theme.
    <section id="contact" className="relative bg-[#1d1d1f] dark:bg-black py-16 md:py-16 overflow-hidden">
      {/* Ambient glow — one section start to finish (CTA + footer live in the
          same box here, unlike volunteer-home-page's separate sections), so
          a single glow spans both without needing to be stitched together. */}
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 w-[600px] h-[420px] bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"
      />

      <div className="max-w-5xl mx-auto px-6 md:px-6 relative">

        {/* Top CTA */}
        <ScrollReveal className="text-center pb-12 md:pb-12 border-b border-white/10">
          <h2 className="text-[28px] md:text-[40px] font-semibold text-white tracking-tight mb-3 md:mb-4">
            Ready to make a difference?
          </h2>
          <p className="text-[15px] md:text-[17px] text-white/60 mb-8 md:mb-6 px-4">
            Join people creating a positive change.
          </p>
          <Button
            onClick={handleSignUpClick}
            className="h-12 md:h-11 px-8 md:px-6 bg-gradient-to-r from-[#ff6b6b] to-[#f59e0b] hover:from-[#ff5252] hover:to-[#e68a00] text-white text-[15px] md:text-[15px] font-bold rounded-full border-0 active:scale-95 transition-all"
          >
            Get started
            <ChevronRight className="w-4 h-4 md:w-4 md:h-4 ml-1" />
          </Button>
        </ScrollReveal>

        {/* Footer — Luma-style: one clean band (brand + links + icons), not a
            boxy 4-column directory. */}
        <ScrollReveal delay={0.1} className="py-10 md:py-10 border-b border-white/10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <Image src="/logowhite.png" alt="KINDLY" width={188} height={44} className="h-5 w-auto self-start shrink-0" />

            <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
              <a href="/how-it-works" className="text-white/60 hover:text-white transition-colors">How it Works</a>
              <a href="/for-volunteers" className="text-white/60 hover:text-white transition-colors">For Volunteers</a>
              <a href="/for-organisations" className="text-white/60 hover:text-white transition-colors">For Organisations</a>
              <a href="/company/about" className="text-white/60 hover:text-white transition-colors">About</a>
              <a href="/company/careers" className="text-white/60 hover:text-white transition-colors">Careers</a>
              <a href="/company/press" className="text-white/60 hover:text-white transition-colors">Press</a>
              <a href="/resources/feedback" className="text-white/60 hover:text-white transition-colors">Feedback</a>
              <a href="/resources/help-center" className="text-white/60 hover:text-white transition-colors">Help Center</a>
              <a href="/resources/community" className="text-white/60 hover:text-white transition-colors">Community</a>
            </nav>

            <div className="flex items-center gap-4">
              <a
                href="https://www.instagram.com/kindly.india"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-white/60 hover:text-white transition-colors"
              >
                <InstagramIcon className="w-5 h-5" />
              </a>
              <a
                href="https://in.linkedin.com/company/teamkindly"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-white/60 hover:text-white transition-colors"
              >
                <LinkedinIcon className="w-5 h-5" />
              </a>
              <a
                href="https://chat.whatsapp.com/JLTD1iP3m8p63Mnz7SjISt"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="text-white/60 hover:text-white transition-colors"
              >
                <WhatsappIcon className="w-5 h-5" />
              </a>
            </div>
          </div>
        </ScrollReveal>

        {/* Bottom row — contact info + legal, no copyright line */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-white/50">
          <span className="whitespace-nowrap">team@kindly.co.in</span>
          <span className="whitespace-nowrap">+91 7517018954</span>
          <span className="flex items-center gap-1 whitespace-nowrap"><MapPin className="w-3 h-3" /> Nashik, India</span>
          <span className="text-white/20">•</span>
          <a href="/legal/privacy" className="whitespace-nowrap hover:text-white transition-colors">Privacy Policy</a>
          <a href="/legal/terms" className="whitespace-nowrap hover:text-white transition-colors">Terms of Use</a>
          <a href="/legal/cookies" className="whitespace-nowrap hover:text-white transition-colors">Cookie Policy</a>
        </div>
      </div>
    </section>
  )
}
