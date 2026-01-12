import { Mail, Phone, MapPin, ChevronRight, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ContactSection() {
  return (
    <section id="contact" className="bg-[#1d1d1f] py-8 md:py-16">
      <div className="max-w-245 mx-auto px-4 md:px-6">
        {/* Top CTA - smaller on mobile */}
        <div className="text-center pb-6 md:pb-12 border-b border-[#424245]">
          <div className="flex justify-center mb-3 md:mb-6">
            <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-[#ff6b6b] to-[#f59e0b] flex items-center justify-center">
              <Heart className="w-5 h-5 md:w-8 md:h-8 text-white" />
            </div>
          </div>
          <h2 className="text-[20px] md:text-[40px] font-semibold text-white tracking-tight mb-2 md:mb-4">
            Ready to make a difference?
          </h2>
          <p className="text-[12px] md:text-[17px] text-[#86868b] mb-4 md:mb-6">
            Join thousands of volunteers creating positive change.
          </p>
          <Button
            asChild
            className="h-9 md:h-11 px-4 md:px-6 bg-gradient-to-r from-[#ff6b6b] to-[#f59e0b] hover:from-[#ff5252] hover:to-[#e68a00] text-white text-[12px] md:text-[15px] rounded-full border-0"
          >
            <a href="#hero">
              Get started
              <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 ml-1" />
            </a>
          </Button>
        </div>

        {/* Footer Links - 2x2 grid on mobile */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-8 py-6 md:py-12 border-b border-[#424245]">
          <div>
            <h3 className="text-[9px] md:text-xs text-[#86868b] font-semibold uppercase tracking-wider mb-2 md:mb-4">
              Platform
            </h3>
            <ul className="space-y-1.5 md:space-y-3">
              <li>
                <a href="/how-it-works" className="text-[11px] md:text-sm text-[#d2d2d7] hover:text-white transition-colors">
                  How it Works
                </a>
              </li>
              <li>
                <a href="/for-volunteers" className="text-[11px] md:text-sm text-[#d2d2d7] hover:text-white transition-colors">
                  For Volunteers
                </a>
              </li>
              <li>
                <a href="/for-organisations" className="text-[11px] md:text-sm text-[#d2d2d7] hover:text-white transition-colors">
                  For Organisations
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[9px] md:text-xs text-[#86868b] font-semibold uppercase tracking-wider mb-2 md:mb-4">
              Company
            </h3>
            <ul className="space-y-1.5 md:space-y-3">
              <li>
                <a href="/company/about" className="text-[11px] md:text-sm text-[#d2d2d7] hover:text-white transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="/company/careers" className="text-[11px] md:text-sm text-[#d2d2d7] hover:text-white transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a href="/company/press" className="text-[11px] md:text-sm text-[#d2d2d7] hover:text-white transition-colors">
                  Press
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[9px] md:text-xs text-[#86868b] font-semibold uppercase tracking-wider mb-2 md:mb-4">
              Resources
            </h3>
            <ul className="space-y-1.5 md:space-y-3">
              <li>
                <a href="/resources/blog" className="text-[11px] md:text-sm text-[#d2d2d7] hover:text-white transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="/resources/help-center" className="text-[11px] md:text-sm text-[#d2d2d7] hover:text-white transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="/resources/community" className="text-[11px] md:text-sm text-[#d2d2d7] hover:text-white transition-colors">
                  Community
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[9px] md:text-xs text-[#86868b] font-semibold uppercase tracking-wider mb-2 md:mb-4">
              Contact
            </h3>
            <ul className="space-y-1.5 md:space-y-3">
              <li className="flex items-center gap-1.5 md:gap-2 text-[11px] md:text-sm text-[#d2d2d7]">
                <Mail className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
                <span className="truncate">service@kindly.co.in</span>
              </li>
              <li className="flex items-center gap-1.5 md:gap-2 text-[11px] md:text-sm text-[#d2d2d7]">
                <Phone className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
                +91 7517018954
              </li>
              <li className="flex items-center gap-1.5 md:gap-2 text-[11px] md:text-sm text-[#d2d2d7]">
                <MapPin className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
                Nashik, India
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright - stacked on mobile */}
        <div className="pt-4 md:pt-8 flex flex-col md:flex-row items-center justify-between gap-2 md:gap-4">
          <p className="text-[9px] md:text-xs text-[#86868b]">Copyright © 2025 Kindly. All rights reserved.</p>
          <div className="flex items-center gap-3 md:gap-6">
            <a href="#" className="text-[9px] md:text-xs text-[#86868b] hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-[9px] md:text-xs text-[#86868b] hover:text-white transition-colors">
              Terms of Use
            </a>
            <a href="#" className="text-[9px] md:text-xs text-[#86868b] hover:text-white transition-colors">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
