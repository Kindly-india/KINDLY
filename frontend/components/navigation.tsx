"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import Image from "next/image"

export function Navigation() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "bg-white/95 backdrop-blur-md border-b border-[#f5f5f7]" : "bg-transparent", // ✅ Updated border/bg to match Volunteer
      )}
    >
      {/* ✅ Updated Max Width and Padding to match Volunteer Page (max-w-300 px-4 md:px-8) */}
      <div className="max-w-300 mx-auto px-4 md:px-8">
        
        {/* ✅ Updated Height to match Volunteer Page (h-12 md:h-14) */}
        <div className="flex items-center justify-between h-12 md:h-14">

          {/* ✅ Updated Logo Size */}
          <Link href="/" className="inline-flex items-center shrink-0">
            <Image
              src="/logo.png"
              alt="Kindly"
              width={100}
              height={30}
              className="h-5 md:h-6 w-auto" // Matches Volunteer Page
              priority
            />
          </Link>

          {/* ✅ Updated Link Text Size (text-[13px] md:text-[15px]) */}
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {[
              { label: "About", id: "about" },
              { label: "Events", id: "events" },
              { label: "Contact", id: "contact" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  const element = document.getElementById(item.id)
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth" })
                  }
                }}
                className="text-[13px] md:text-[15px] font-medium text-[#1d1d1f] hover:text-[#0066cc] transition-colors" // Matches Volunteer Fonts
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* ✅ Updated Login Button Size */}
          <Link 
            href="/login" 
            className="text-[13px] md:text-[15px] font-medium text-[#0066cc] hover:underline"
          >
            Log in
          </Link>
        </div>
      </div>
    </nav>
  )
}