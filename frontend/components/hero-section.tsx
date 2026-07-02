"use client"

import { Heart, Sparkles } from "lucide-react"
import Image from "next/image"
import { AuthCard } from "@/components/auth-card"
import { Card } from "@/components/ui/card"

export function HeroSection() {
  return (
    <section id="hero" className="min-h-screen bg-background md:bg-gradient-to-b md:from-orange-50 dark:from-orange-50/10 md:via-white dark:via-background md:to-green-50 dark:to-green-50/10 flex flex-col items-center justify-center px-4 md:px-6 py-12 md:py-20 relative overflow-x-hidden">

      {/* Hide floating icons on mobile for a cleaner form experience */}
      <div className="hidden md:flex absolute top-28 left-20 w-14 h-14 rounded-2xl bg-card shadow-lg items-center justify-center z-10">
        <Heart className="w-7 h-7 text-red-400" />
      </div>
      <div className="hidden md:flex absolute top-40 right-24 w-14 h-14 rounded-2xl bg-card shadow-lg items-center justify-center z-10">
        <Sparkles className="w-7 h-7 text-amber-500" />
      </div>

      <div className="mb-6 md:mb-8 animate-in fade-in zoom-in duration-500">
        <Image src="/logoblack.png" alt="Kindly Icon" width={80} height={80} className="w-16 h-16 md:w-20 md:h-20 dark:invert" priority />
      </div>

      <h1 className="text-[40px] md:text-6xl font-bold text-foreground tracking-tight text-center leading-[1.1]">
        Make a difference.
        <br />
        <span className="text-red-400">Start today.</span>
      </h1>

      <p className="text-base md:text-xl text-muted-foreground text-center mt-4 md:mt-6 mb-10 md:mb-12 max-w-sm md:max-w-2xl font-medium">
        Join a growing community making a real impact.
      </p>

      <div className="w-full max-w-lg md:max-w-xl relative">
        <Card className="relative md:rounded-3xl p-6 md:p-10 shadow-sm md:shadow-xl">
          <AuthCard />
        </Card>
      </div>
    </section>
  )
}
