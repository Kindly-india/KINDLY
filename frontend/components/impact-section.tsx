"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

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
    { value: 0, label: "Volunteers Connected", suffix: "+" },
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
    <section className="bg-gradient-to-b from-[#fff5f0] to-[#fff0e6] py-12 md:py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-6">
        
        <div className="text-center mb-10 md:mb-16">
          {/* Subtitle: Bumped to 12px for mobile legibility */}
          <p className="text-[#e85d3b] text-[12px] md:text-sm font-medium mb-1 md:mb-2 uppercase tracking-wide">Our Impact</p>
          
          {/* Header: Bumped to 28px on mobile to act as a proper title */}
          <h2 className="text-[28px] md:text-[56px] font-semibold text-[#1d1d1f] tracking-tight leading-tight">
            Together, we're
            <br />
            <span className="bg-gradient-to-r from-[#e85d3b] to-[#f59e0b] bg-clip-text text-transparent">
              making a difference.
            </span>
          </h2>
        </div>

        {/* Grid: 2 columns on mobile. Added gap-y-10 so the rows have vertical space */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10 md:gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              {/* Stat Number: text-3xl (30px) so it's readable on small screens */}
              <div className="text-3xl md:text-[56px] font-semibold text-[#1d1d1f] tracking-tight leading-none mb-1 md:mb-2 min-h-[1em]">
                {loading ? (
                  <span className="animate-pulse opacity-50 text-gray-400">0</span>
                ) : (
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                )}
              </div>
              {/* Stat Label: text-[12px] (sm) is the standard minimum for mobile body text */}
              <p className="text-[12px] md:text-[15px] text-[#86868b] leading-tight px-2">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}