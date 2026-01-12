"use client"

import { Search, UserPlus, Calendar, Heart, CheckCircle2, ArrowRight } from "lucide-react"

export default function HowItWorksPage() {
  const steps = [
    {
      id: 1,
      title: "Create Your Account",
      description: "Sign up as a volunteer or an organization. It takes less than 2 minutes to get started and verify your identity.",
      icon: UserPlus,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      id: 2,
      title: "Discover Opportunities",
      description: "Browse through hundreds of local events. Filter by cause, location, or time commitment to find what suits you.",
      icon: Search,
      color: "text-amber-600",
      bg: "bg-amber-50"
    },
    {
      id: 3,
      title: "Register & Participate",
      description: "Book your slot for an event. You'll receive all the necessary details and a QR code for check-in.",
      icon: Calendar,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      id: 4,
      title: "Track Your Impact",
      description: "After the event, your hours are verified automatically. Earn certificates and watch your impact score grow.",
      icon: Heart,
      color: "text-rose-600",
      bg: "bg-rose-50"
    }
  ]

  return (
    <div className="bg-white min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-6xl font-bold text-[#1d1d1f] tracking-tight mb-6">
            Simple steps to <br/>
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              massive impact.
            </span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Kindly bridges the gap between intention and action. Here is how our platform connects you to the causes that matter.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 md:before:ml-[50%] before:-translate-x-px md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
          {steps.map((step, index) => (
            <div key={step.id} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active`}>
              
              {/* Icon Marker */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-gray-100 group-hover:bg-black transition-colors shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                <span className="text-xs font-bold text-gray-500 group-hover:text-white">{step.id}</span>
              </div>

              {/* Content Card */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 ${step.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <step.icon className={`w-6 h-6 ${step.color}`} />
                </div>
                <h3 className="text-xl font-bold text-[#1d1d1f] mb-2">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#f5f5f7] rounded-full text-sm font-medium text-[#1d1d1f] mb-8">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            Join 50,000+ volunteers today
          </div>
        </div>
      </div>
    </div>
  )
}