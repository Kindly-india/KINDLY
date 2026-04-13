"use client"

import { Quote } from "lucide-react"

const testimonials = [
  {
    quote: "I started KINDLY because I saw incredible people wanting to help, but no easy way to connect them with local causes. We are finally bridging the gap between good intentions and real, measurable community action.",
    name: "Manas Dhivare",
    role: "Founder - Kindly",
    avatar: "/KINDLY/frontend/public/F550D71A-C3B3-4E55-9AC4-21C04BDC4675_4_5005_c.jpeg",
  },
  {
    quote:
      "Our goal was to build technology that removes all friction from social work. Seeing NGOs ditch chaotic WhatsApp groups to seamlessly manage hundreds of volunteers on our platform is incredibly fulfilling.",
    name: "Aditya Dhongade",
    role: "Co Founder - Kindly",
    avatar: "/KINDLY/frontend/public/8F851C78-4111-4552-9B4D-C35481F80A44_4_5005_c.jpeg",
  },
  {
    quote:
      "Finding weekend volunteering drives in Nashik used to be so difficult. Now, I not only discover great local causes instantly, but I also get to build a verified digital resume of my impact.",
    name: "Ananya Patel",
    role: "Student Volunteer",
    avatar: "/KINDLY/frontend/public/596DF1EC-B153-4626-9C23-DFA8243249FB_4_5005_c.jpeg",
  },
]

export function TestimonialsSection() {
  return (
    <section className="bg-gradient-to-b from-[#fffbeb] to-[#fef3c7] py-16 md:py-24 overflow-hidden">
      <div className="max-w-245 mx-auto px-6 md:px-6">
        
        <div className="text-center mb-10 md:mb-16">
          <p className="text-[#d97706] text-[12px] md:text-sm font-medium mb-1 md:mb-2 uppercase tracking-wide">Testimonials</p>
          <h2 className="text-[28px] md:text-[56px] font-semibold text-[#1d1d1f] tracking-tight leading-tight">
            Stories that inspire us.
          </h2>
        </div>

        {/* Carousel Container */}
        {/* Mobile: flex row with horizontal scroll and snapping */}
        {/* Desktop: standard grid col 3 */}
        <div className="flex md:grid md:grid-cols-3 overflow-x-auto md:overflow-x-visible pb-8 md:pb-0 gap-6 snap-x snap-mandatory no-scrollbar -mx-6 px-6 md:mx-0 md:px-0">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              // w-[85vw] on mobile makes the next card peek out slightly (visual cue to scroll)
              className="min-w-[85vw] md:min-w-0 bg-white rounded-2xl md:rounded-2xl p-6 md:p-8 shadow-md shadow-[#d97706]/5 hover:shadow-xl hover:shadow-[#d97706]/10 transition-all duration-300 snap-center flex flex-col"
            >
              <Quote className="w-6 h-6 md:w-10 md:h-10 text-[#f59e0b] mb-4 md:mb-6" />

              <p className="text-[15px] md:text-[17px] text-[#1d1d1f] leading-relaxed mb-6 md:mb-8 flex-1">
                "{testimonial.quote}"
              </p>

              <div className="flex items-center gap-3 md:gap-4">
                <img
                  src={testimonial.avatar || "/placeholder.svg"}
                  alt={testimonial.name}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border border-gray-100"
                />
                <div>
                  <p className="text-[14px] md:text-[15px] font-semibold text-[#1d1d1f]">
                    {testimonial.name}
                  </p>
                  <p className="text-[12px] md:text-[13px] text-[#86868b]">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Optional: Add this CSS to your globals.css to hide the scrollbar track on mobile carousel */}
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