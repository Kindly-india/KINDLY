"use client"

import { Mail, Phone, MapPin, ChevronRight, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
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
    // Increased mobile padding (py-16) so it doesn't feel like an afterthought
    <section id="contact" className="bg-[#1d1d1f] py-16 md:py-16">
      <div className="max-w-5xl mx-auto px-6 md:px-6">
        
        {/* Top CTA */}
        <div className="text-center pb-12 md:pb-12 border-b border-[#424245]">
          <div className="flex justify-center mb-6 md:mb-6">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-[#ff6b6b] to-[#f59e0b] flex items-center justify-center shadow-lg shadow-black/20">
              <Heart className="w-7 h-7 md:w-8 md:h-8 text-white" />
            </div>
          </div>
          {/* Title: 28px for mobile prominence */}
          <h2 className="text-[28px] md:text-[40px] font-semibold text-white tracking-tight mb-3 md:mb-4">
            Ready to make a difference?
          </h2>
          {/* Paragraph: 15px is readable and professional */}
          <p className="text-[15px] md:text-[17px] text-[#86868b] mb-8 md:mb-6 px-4">
            Join people creating a positive change.
          </p>
          {/* Button: h-12 for a better mobile tap target */}
          <Button
            onClick={handleSignUpClick}
            className="h-12 md:h-11 px-8 md:px-6 bg-gradient-to-r from-[#ff6b6b] to-[#f59e0b] hover:from-[#ff5252] hover:to-[#e68a00] text-white text-[15px] md:text-[15px] font-bold rounded-full border-0 active:scale-95 transition-all"
          >
            Get started
            <ChevronRight className="w-4 h-4 md:w-4 md:h-4 ml-1" />
          </Button>
        </div>

        {/* Footer Links - 2x2 grid is good, but bumped text sizes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6 py-12 md:py-12 border-b border-[#424245]">
          <div>
            {/* Header: text-[12px] is the minimum for uppercase labels */}
            <h3 className="text-[12px] md:text-xs text-[#86868b] font-bold uppercase tracking-widest mb-4 md:mb-4">
              Platform
            </h3>
            <ul className="space-y-3 md:space-y-3">
              <li>
                <a href="/how-it-works" className="text-[14px] md:text-sm text-[#d2d2d7] hover:text-white transition-colors">
                  How it Works
                </a>
              </li>
              <li>
                <a href="/for-volunteers" className="text-[14px] md:text-sm text-[#d2d2d7] hover:text-white transition-colors">
                  For Volunteers
                </a>
              </li>
              <li>
                <a href="/for-organisations" className="text-[14px] md:text-sm text-[#d2d2d7] hover:text-white transition-colors">
                  For Organisations
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[12px] md:text-xs text-[#86868b] font-bold uppercase tracking-widest mb-4 md:mb-4">
              Company
            </h3>
            <ul className="space-y-3 md:space-y-3">
              <li>
                <a href="/company/about" className="text-[14px] md:text-sm text-[#d2d2d7] hover:text-white transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="/company/careers" className="text-[14px] md:text-sm text-[#d2d2d7] hover:text-white transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a href="/company/press" className="text-[14px] md:text-sm text-[#d2d2d7] hover:text-white transition-colors">
                  Press
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[12px] md:text-xs text-[#86868b] font-bold uppercase tracking-widest mb-4 md:mb-4">
              Resources
            </h3>
            <ul className="space-y-3 md:space-y-3">
              <li>
                <a href="/resources/feedback" className="text-[14px] md:text-sm text-[#d2d2d7] hover:text-white transition-colors">
                  Feedback
                </a>
              </li>
              <li>
                <a href="/resources/help-center" className="text-[14px] md:text-sm text-[#d2d2d7] hover:text-white transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="/resources/community" className="text-[14px] md:text-sm text-[#d2d2d7] hover:text-white transition-colors">
                  Community
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[12px] md:text-xs text-[#86868b] font-bold uppercase tracking-widest mb-4 md:mb-4">
              Contact
            </h3>
            <ul className="space-y-3 md:space-y-3">
              <li className="flex items-center gap-2 text-[14px] md:text-sm text-[#d2d2d7]">
                <Mail className="w-4 h-4 md:w-4 md:h-4 shrink-0 text-[#86868b]" />
                <span className="truncate">manasdhivare@gmail.com</span>
              </li>
              <li className="flex items-center gap-2 text-[14px] md:text-sm text-[#d2d2d7]">
                <Phone className="w-4 h-4 md:w-4 md:h-4 shrink-0 text-[#86868b]" />
                +91 7517018954
              </li>
              <li className="flex items-center gap-2 text-[14px] md:text-sm text-[#d2d2d7]">
                <MapPin className="w-4 h-4 md:w-4 md:h-4 shrink-0 text-[#86868b]" />
                Nashik, India
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 md:pt-8 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">
          <p className="text-[12px] md:text-xs text-[#86868b] font-medium">Copyright © 2026 Kindly. All rights reserved.</p>
          <div className="flex items-center gap-5 md:gap-6">
            <a href="/legal/privacy" className="text-[12px] md:text-xs text-[#86868b] hover:text-white transition-colors font-medium">
              Privacy Policy
            </a>
            <a href="/legal/terms" className="text-[12px] md:text-xs text-[#86868b] hover:text-white transition-colors font-medium">
              Terms of Use
            </a>
            <a href="/legal/cookies" className="text-[12px] md:text-xs text-[#86868b] hover:text-white transition-colors font-medium">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}