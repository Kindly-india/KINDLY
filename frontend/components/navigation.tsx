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

  const navLinks = [
    { label: "About", id: "about" },
    { label: "Events", id: "events" },
    { label: "Contact", id: "contact" },
  ]

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "bg-white/95 backdrop-blur-md border-b border-[#f5f5f7]" : "bg-transparent",
      )}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-12 md:h-14">
          
          {/* Left: Logo (Always visible) */}
          <Link href="/" className="inline-flex items-center shrink-0">
            <Image
              src="/logo.png"
              alt="Kindly"
              width={100}
              height={30}
              className="h-5 md:h-6 w-auto"
              priority
            />
          </Link>

          {/* Center: Desktop Links (Hidden on Mobile) */}
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {navLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="text-[15px] font-medium text-[#1d1d1f] hover:text-[#0066cc] transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right: Login (Discreet on mobile) */}
          <div className="flex items-center">
            <Link 
              href="/login" 
              className="text-[13px] md:text-[15px] font-bold text-[#1d1d1f] md:text-[#0066cc] hover:underline"
            >
              Log in
            </Link>
          </div>
          
        </div>
      </div>
    </nav>
  )
}