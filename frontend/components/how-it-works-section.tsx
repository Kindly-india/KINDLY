import { UserPlus, Search, CalendarCheck } from "lucide-react"

export function HowItWorksSection() {
  return (
    <section className="bg-gradient-to-b from-[#f0fdf4] to-[#ecfdf5] py-10 md:py-24">
      <div className="max-w-245 mx-auto px-4 md:px-6">
        <div className="text-center mb-6 md:mb-16">
          <p className="text-[#059669] text-[10px] md:text-sm font-medium mb-1 md:mb-2">How It Works</p>
          <h2 className="text-[24px] md:text-[56px] font-semibold text-[#1d1d1f] tracking-tight leading-tight">
            Start helping in
            <br />
            three simple steps.
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-3 md:gap-12">
          {/* Step 1 */}
          <div className="relative">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-white shadow-xl shadow-[#059669]/10 flex items-center justify-center mb-3 md:mb-6 relative">
                <UserPlus className="w-6 h-6 md:w-10 md:h-10 text-[#059669]" />
                <span className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 w-5 h-5 md:w-7 md:h-7 bg-[#059669] text-white text-[10px] md:text-sm font-semibold rounded-full flex items-center justify-center">
                  1
                </span>
              </div>
              <h3 className="text-[12px] md:text-[24px] font-semibold text-[#1d1d1f] mb-1 md:mb-3">Create Profile</h3>
              <p className="text-[9px] md:text-[17px] text-[#86868b] leading-relaxed">
                Sign up and share your interests.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-white shadow-xl shadow-[#059669]/10 flex items-center justify-center mb-3 md:mb-6 relative">
                <Search className="w-6 h-6 md:w-10 md:h-10 text-[#059669]" />
                <span className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 w-5 h-5 md:w-7 md:h-7 bg-[#059669] text-white text-[10px] md:text-sm font-semibold rounded-full flex items-center justify-center">
                  2
                </span>
              </div>
              <h3 className="text-[12px] md:text-[24px] font-semibold text-[#1d1d1f] mb-1 md:mb-3">Find Events</h3>
              <p className="text-[9px] md:text-[17px] text-[#86868b] leading-relaxed">Browse matching opportunities.</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-white shadow-xl shadow-[#059669]/10 flex items-center justify-center mb-3 md:mb-6 relative">
                <CalendarCheck className="w-6 h-6 md:w-10 md:h-10 text-[#059669]" />
                <span className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 w-5 h-5 md:w-7 md:h-7 bg-[#059669] text-white text-[10px] md:text-sm font-semibold rounded-full flex items-center justify-center">
                  3
                </span>
              </div>
              <h3 className="text-[12px] md:text-[24px] font-semibold text-[#1d1d1f] mb-1 md:mb-3">Make Impact</h3>
              <p className="text-[9px] md:text-[17px] text-[#86868b] leading-relaxed">Show up and make a difference.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
