"use client"
import { Quote } from "lucide-react"
import { Card } from "@/components/ui/card"

export function TestimonialsSection() {
  return (
    <section className="bg-gradient-to-b from-[#fffbeb] dark:from-[#fffbeb]/10 to-[#fef3c7] dark:to-[#fef3c7]/10 py-20 md:py-32 overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 md:px-8">
        <div className="text-center mb-10 md:mb-20">
          <p className="text-[#d97706] text-[12px] md:text-sm font-medium mb-1 md:mb-2 uppercase tracking-wide">
            KINDLY
          </p>
          <h2 className="text-[28px] md:text-[56px] font-semibold text-foreground tracking-tight leading-tight">
            The Founder.
          </h2>
        </div>

        <div className="flex flex-col md:flex-row justify-center items-stretch gap-6 md:gap-8">
          <Card className="w-full md:max-w-xl p-8 md:p-12 shadow-md shadow-[#d97706]/5 hover:shadow-xl hover:shadow-[#d97706]/10 transition-all duration-300 flex flex-col">
            <Quote className="w-8 h-8 md:w-12 md:h-12 text-[#f59e0b] mb-6 md:mb-8" />
            <p className="text-[17px] md:text-[20px] text-foreground leading-relaxed mb-8 md:mb-10 flex-1">
              "Wanted a place where people actually show up for each other. The good deed part just comes with it."
            </p>
            <div className="flex items-center gap-4">
              <img
                src="manya.jpeg"
                alt="Manas Dhivare"
                className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border border-border"
              />
              <div>
                <p className="text-[15px] md:text-[16px] font-semibold text-foreground">
                  Manas Dhivare
                </p>
                <p className="text-[12px] md:text-[13px] text-muted-foreground">
                  Founder
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  )
}