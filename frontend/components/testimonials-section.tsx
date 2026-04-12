import { Quote } from "lucide-react"

const testimonials = [
  {
    quote: "I started KINDLY because I saw incredible people wanting to help, but no easy way to connect them with local causes. We are finally bridging the gap between good intentions and real, measurable community action.",
    name: "Manas DHivare",
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
    name: "Tony Stark",
    role: "Student Volunteer",
    avatar: "/KINDLY/frontend/public/596DF1EC-B153-4626-9C23-DFA8243249FB_4_5005_c.jpeg",
  },
]

export function TestimonialsSection() {
  return (
    <section className="bg-gradient-to-b from-[#fffbeb] to-[#fef3c7] py-8 md:py-24">
      <div className="max-w-245 mx-auto px-4 md:px-6">
        <div className="text-center mb-4 md:mb-16">
          <p className="text-[#d97706] text-[9px] md:text-sm font-medium mb-1 md:mb-2">Testimonials</p>
          <h2 className="text-[20px] md:text-[56px] font-semibold text-[#1d1d1f] tracking-tight leading-tight">
            Stories that inspire us.
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-2 md:gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-lg md:rounded-2xl p-2 md:p-8 shadow-md shadow-[#d97706]/5 hover:shadow-xl hover:shadow-[#d97706]/10 transition-all duration-300"
            >
              <Quote className="w-3 h-3 md:w-10 md:h-10 text-[#f59e0b] mb-1.5 md:mb-6" />

              <p className="text-[8px] md:text-[17px] text-[#1d1d1f] leading-tight md:leading-relaxed mb-2 md:mb-8 line-clamp-3 md:line-clamp-none">
                "{testimonial.quote}"
              </p>

              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                <img
                  src={testimonial.avatar || "/placeholder.svg"}
                  alt={testimonial.name}
                  className="w-5 h-5 md:w-12 md:h-12 rounded-full object-cover"
                />
                <div>
                  <p className="text-[7px] md:text-[15px] font-semibold text-[#1d1d1f] leading-tight">
                    {testimonial.name}
                  </p>
                  <p className="text-[6px] md:text-[13px] text-[#86868b] leading-tight">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
