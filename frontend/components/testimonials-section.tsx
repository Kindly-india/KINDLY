"use client"
import { Quote } from "lucide-react"

export function TestimonialsSection() {
  return (
    <section className="bg-gradient-to-b from-[#fffbeb] to-[#fef3c7] py-16 md:py-24 overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 md:px-6">
        <div className="text-center mb-10 md:mb-16">
          <p className="text-[#d97706] text-[12px] md:text-sm font-medium mb-1 md:mb-2 uppercase tracking-wide">
            KINDLY
          </p>
          <h2 className="text-[28px] md:text-[56px] font-semibold text-[#1d1d1f] tracking-tight leading-tight">
            The Founders.
          </h2>
        </div>

        <div className="flex flex-col md:flex-row justify-center items-stretch gap-6 md:gap-8">
          <div className="w-full md:max-w-xl bg-white rounded-2xl p-8 md:p-12 shadow-md shadow-[#d97706]/5 hover:shadow-xl hover:shadow-[#d97706]/10 transition-all duration-300 flex flex-col">
            <Quote className="w-8 h-8 md:w-12 md:h-12 text-[#f59e0b] mb-6 md:mb-8" />
            <p className="text-[17px] md:text-[20px] text-[#1d1d1f] leading-relaxed mb-8 md:mb-10 flex-1">
              "Wanted a place where people actually show up for each other. The good deed part just comes with it."
            </p>
            <div className="flex items-center gap-4">
              <img
                src="manya.jpeg"
                alt="Manas Dhivare"
                className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border border-gray-100"
              />
              <div>
                <p className="text-[15px] md:text-[16px] font-semibold text-[#1d1d1f]">
                  Manas Dhivare
                </p>
                <p className="text-[12px] md:text-[13px] text-[#86868b]">
                  Founder
                </p>
              </div>
            </div>
          </div>

          <div className="w-full md:max-w-xl bg-white rounded-2xl p-8 md:p-12 shadow-md shadow-[#d97706]/5 hover:shadow-xl hover:shadow-[#d97706]/10 transition-all duration-300 flex flex-col">
            <Quote className="w-8 h-8 md:w-12 md:h-12 text-[#f59e0b] mb-6 md:mb-8" />
            <p className="text-[17px] md:text-[20px] text-[#1d1d1f] leading-relaxed mb-8 md:mb-10 flex-1">
              "We didn't want to build features. We wanted to give people a real reason to come, the tech just had to get out of the way and let that happen."
            </p>
            <div className="flex items-center gap-4">
              <img
                src="aditya.jpg"
                alt="Aditya Dhongade"
                className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border border-gray-100"
              />
              <div>
                <p className="text-[15px] md:text-[16px] font-semibold text-[#1d1d1f]">
                  Aditya Dhongade
                </p>
                <p className="text-[12px] md:text-[13px] text-[#86868b]">
                  Co-Founder
                </p>
              </div>
            </div>
          </div>
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