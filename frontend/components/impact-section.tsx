"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { ScrollReveal } from "@/components/ui/scroll-reveal"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ... [AnimatedCounter stays exactly the same as your original] ...
function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (value === 0) { setCount(0); return; }
    const duration = 2000
    const steps = 60
    const increment = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])
  return <span>{count.toLocaleString()}{suffix}</span>
}

export function ImpactSection() {
  const [stats, setStats] = useState([
    { value: 0, label: "Individuals Connected", suffix: "+" },
    { value: 0, label: "Organisations", suffix: "+" },
    { value: 0, label: "Hours Contributed", suffix: "+" },
    { value: 0, label: "Cities Reached", suffix: "" },
  ])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data, error } = await supabase.rpc('get_impact_stats')
        if (error) { console.error("Error details:", error.message); return; }
        if (data) {
          setStats([
            { value: data.volunteers, label: "Volunteers Connected", suffix: "+" },
            { value: data.orgs, label: "Organisations", suffix: "+" },
            { value: data.hours, label: "Hours Contributed", suffix: "+" },
            { value: data.cities, label: "Cities Reached", suffix: "" },
          ])
        }
      } catch (err) {
        console.error("Unexpected error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    // Increased mobile vertical padding (py-12) so it doesn't look squashed
    <section className="bg-gradient-to-b from-[#fff5f0] dark:from-black to-[#fff0e6] dark:to-black py-16 md:py-32 relative overflow-hidden">
      {/* Ambient side glow — this section's own dominant color (the orange
          "Our Impact" accent), on the right to alternate with Hero's left. */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-[#e85d3b]/[0.04] dark:bg-[#e85d3b]/[0.08] rounded-full blur-3xl pointer-events-none"
      />

      <div className="max-w-7xl mx-auto px-6 md:px-8 relative">

        <ScrollReveal className="text-center mb-10 md:mb-20">
          {/* Subtitle: Bumped to 12px for mobile legibility */}
          <p className="text-[#e85d3b] text-[12px] md:text-sm font-medium mb-1 md:mb-2 uppercase tracking-wide">Our Impact</p>

          {/* Header: Bumped to 28px on mobile to act as a proper title */}
          <h2 className="text-[28px] md:text-[56px] font-semibold text-foreground dark:text-white tracking-tight leading-tight">
            Together, we&apos;re
            <br />
            <span className="bg-gradient-to-r from-[#e85d3b] to-[#f59e0b] bg-clip-text text-transparent">
              making a difference.
            </span>
          </h2>
        </ScrollReveal>

        {/* Grid: 2 columns on mobile. Added gap-y-10 so the rows have vertical space */}
        <ScrollReveal delay={0.15} className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10 md:gap-12">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              {/* Stat Number: text-3xl (30px) so it's readable on small screens */}
              <div className="text-3xl md:text-[56px] font-semibold text-foreground dark:text-white tracking-tight leading-none mb-1 md:mb-2 min-h-[1em]">
                {loading ? (
                  <span className="animate-pulse opacity-50 text-muted-foreground">0</span>
                ) : (
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                )}
              </div>
              {/* Stat Label: text-[12px] (sm) is the standard minimum for mobile body text */}
              <p className="text-[12px] md:text-[15px] text-muted-foreground dark:text-neutral-400 leading-tight px-2">
                {stat.label}
              </p>
            </div>
          ))}
        </ScrollReveal>
      </div>
    </section>
  )
}