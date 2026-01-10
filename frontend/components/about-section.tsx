import { Heart, Users, Globe, Sparkles } from "lucide-react"

export function AboutSection() {
  return (
    <section id="about" className="bg-white py-10 md:py-24">
      <div className="max-w-245 mx-auto px-4 md:px-6">
        {/* Header - smaller on mobile */}
        <div className="text-center mb-6 md:mb-16">
          <p className="text-[#06c] text-[10px] md:text-sm font-medium mb-1 md:mb-2">About</p>
          <h2 className="text-[24px] md:text-[56px] font-semibold text-[#1d1d1f] tracking-tight leading-tight">
            Volunteering.
            <br />
            Redefined.
          </h2>
        </div>

        {/* Mission Text - smaller on mobile */}
        <p className="text-[13px] md:text-[21px] text-[#1d1d1f] text-center max-w-170 mx-auto leading-relaxed mb-8 md:mb-20">
          We're on a mission to connect passionate volunteers with organisations that are making real change. Every
          connection sparks a difference.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          <div className="text-center">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-[#ff6b6b] to-[#ee5a5a] flex items-center justify-center mx-auto mb-2.5 md:mb-5 shadow-lg shadow-[#ff6b6b]/20">
              <Heart className="w-5 h-5 md:w-7 md:h-7 text-white" />
            </div>
            <h3 className="text-[13px] md:text-[21px] font-semibold text-[#1d1d1f] mb-1 md:mb-2">Impact First</h3>
            <p className="text-[10px] md:text-[15px] text-[#86868b] leading-relaxed">
              Every volunteer hour creates lasting change.
            </p>
          </div>

          <div className="text-center">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-[#f59e0b] to-[#d97706] flex items-center justify-center mx-auto mb-2.5 md:mb-5 shadow-lg shadow-[#f59e0b]/20">
              <Users className="w-5 h-5 md:w-7 md:h-7 text-white" />
            </div>
            <h3 className="text-[13px] md:text-[21px] font-semibold text-[#1d1d1f] mb-1 md:mb-2">Community Driven</h3>
            <p className="text-[10px] md:text-[15px] text-[#86868b] leading-relaxed">
              Join thousands building a better tomorrow.
            </p>
          </div>

          <div className="text-center">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center mx-auto mb-2.5 md:mb-5 shadow-lg shadow-[#10b981]/20">
              <Globe className="w-5 h-5 md:w-7 md:h-7 text-white" />
            </div>
            <h3 className="text-[13px] md:text-[21px] font-semibold text-[#1d1d1f] mb-1 md:mb-2">Global Reach</h3>
            <p className="text-[10px] md:text-[15px] text-[#86868b] leading-relaxed">Find opportunities near or far.</p>
          </div>

          <div className="text-center">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] flex items-center justify-center mx-auto mb-2.5 md:mb-5 shadow-lg shadow-[#8b5cf6]/20">
              <Sparkles className="w-5 h-5 md:w-7 md:h-7 text-white" />
            </div>
            <h3 className="text-[13px] md:text-[21px] font-semibold text-[#1d1d1f] mb-1 md:mb-2">Spark Joy</h3>
            <p className="text-[10px] md:text-[15px] text-[#86868b] leading-relaxed">
              Experience the fulfillment of giving back.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
