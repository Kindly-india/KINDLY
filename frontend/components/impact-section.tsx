"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ... [Keep AnimatedCounter component exactly the same] ...

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (value === 0) {
      setCount(0)
      return
    }

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
        // ✅ SECURE: Call the RPC function
        const { data, error } = await supabase.rpc('get_impact_stats')

        if (error) {
          // Log specific properties to see the real message
          console.error("Error details:", error.message, error.details, error.hint);
          return;
        }

        // 'data' will look like: { volunteers: 10, orgs: 5, hours: 100, cities: 3 }
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
    <section className="bg-gradient-to-b from-[#fff5f0] to-[#fff0e6] py-8 md:py-24">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-5 md:mb-16">
          <p className="text-[#e85d3b] text-[10px] md:text-sm font-medium mb-1 md:mb-2">Our Impact</p>
          <h2 className="text-[22px] md:text-[56px] font-semibold text-[#1d1d1f] tracking-tight leading-tight">
            Together, we're
            <br />
            <span className="bg-gradient-to-r from-[#e85d3b] to-[#f59e0b] bg-clip-text text-transparent">
              making a difference.
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-[20px] md:text-[56px] font-semibold text-[#1d1d1f] tracking-tight leading-none mb-0.5 md:mb-2 min-h-[1em]">
                {loading ? (
                  <span className="animate-pulse opacity-50 text-gray-400">0</span>
                ) : (
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                )}
              </div>
              <p className="text-[9px] md:text-[15px] text-[#86868b]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}