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
        scrolled ? "bg-white/80 backdrop-blur-xl border-b border-[#d2d2d7]" : "bg-[#fbfbfd]",
      )}
    >
      <div className="max-w-245 mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-11 md:h-12">

          <Link href="/" className="inline-flex items-center">
            <Image
              src="/logo.png"   // ✅ Correct: Points directly to the public folder root
              alt="Kindly"
              width={120}
              height={40}
              className="h-8 w-auto"
              priority
            />
          </Link>


          <div className="hidden md:flex items-center gap-8">
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
                className="text-xs text-[#1d1d1f] hover:text-[#06c] transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>

          <Link href="/login" className="text-[#06c] text-[13px] md:text-sm hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </nav>
  )
}
