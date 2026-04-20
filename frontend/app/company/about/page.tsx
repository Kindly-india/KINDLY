"use client"

import { Heart, Globe, Shield, TrendingUp, Users, Zap, Mail, MapPin, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

const values = [
  {
    icon: Shield,
    color: "text-blue-600",
    bg: "bg-blue-50",
    title: "Integrity over optics",
    desc: "Every hour volunteered on Kindly is verified. Every attendance record is geo-confirmed. We built verification into the foundation because credibility — for volunteers and organisations alike — is the only thing worth building on."
  },
  {
    icon: Heart,
    color: "text-rose-600",
    bg: "bg-rose-50",
    title: "Community before product",
    desc: "Kindly is a product, but it is more importantly a community. The decisions we make about features, design, and policy start with one question: does this make it easier or harder for someone to show up and help? Technology is just the enabler."
  },
  {
    icon: TrendingUp,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    title: "Long-term impact",
    desc: "One-off charity drives create feel-good moments. Long-term volunteering creates change. Kindly is built to turn a first-time volunteer into a habitual one — through recognition, community, and a profile that grows with every event attended."
  },
  {
    icon: Globe,
    color: "text-amber-600",
    bg: "bg-amber-50",
    title: "Hyper-local, not generic",
    desc: "The most powerful act of kindness is one that happens in your neighbourhood. Kindly does not aggregate national campaigns — it connects you to causes within your city, your ward, your community. Local problems need local people."
  },
  {
    icon: Zap,
    color: "text-violet-600",
    bg: "bg-violet-50",
    title: "Friction is the enemy",
    desc: "The number one reason people don't volunteer is not lack of desire — it's lack of a clear, easy path. Every design decision on Kindly is made to reduce friction: fewer steps, no gatekeeping, no bureaucracy. Showing up should be simple."
  },
  {
    icon: Users,
    color: "text-teal-600",
    bg: "bg-teal-50",
    title: "Transparency by default",
    desc: "Every organisation on Kindly is verified. Every volunteer's history is honest. Reviews are real. Attendance is factual. Kindly does not allow self-reported hours or unverified certificates. Trust is built by showing the truth, not curating it."
  }
]

const timeline = [
  { year: "Early 2025", event: "The idea", desc: "Manas Dhivare, a volunteer in Nashik, notices that local NGOs struggle not with funding but with reliable manpower. Meanwhile, thousands of students and young professionals in the city want to contribute but cannot find vetted opportunities. The idea for Kindly is written on a notebook." },
  { year: "Mid 2025", event: "First version", desc: "A small group of builders comes together to create the first version of Kindly. Events are created manually. Attendance is tracked on paper. But it works — 200 volunteers attend 15 events in Nashik in the first month." },
  { year: "Late 2025", event: "Platform launch", desc: "Kindly launches as a full platform — event creation, volunteer profiles, QR check-in, and certificate generation. Organisations in Nashik, Mumbai, and Pune sign up. 5,000 volunteers join in the first three months." },
  { year: "Early 2026", event: "Expanding across India", desc: "Kindly opens to 8 Indian cities. 50,000 volunteers. 1,200+ events hosted. The geo-lock verification system is introduced, making certificates credible enough to be accepted by colleges and employers. This is just the beginning." }
]

const stats = [
  { value: "50,000+", label: "Volunteers" },
  { value: "8", label: "Cities" },
  { value: "1,200+", label: "Events" },
  { value: "2,400+", label: "Certificates Issued" },
  { value: "120+", label: "Verified Organisations" },
  { value: "142,000+", label: "Volunteer Hours" }
]

export default function AboutPage() {
  const router = useRouter()

  return (
    <div className="bg-white min-h-screen">

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-start mb-6">
            <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-[#1d1d1f] transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#86868b] mb-5 block">About Kindly</span>
          <h1 className="text-5xl md:text-7xl font-bold text-[#1d1d1f] mb-8 tracking-tight leading-[1.05]">
            We believe in the power<br />of{" "}
            <span className="italic font-serif text-gray-400">showing up.</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-3xl mx-auto leading-relaxed">
            Kindly is a volunteering platform built for Indian cities. We connect people who want to help with organisations that need them — and we verify every step of the way. Not because we don't trust people. Because trust is what makes impact real.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 bg-[#1d1d1f]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 text-center">
          {stats.map((s, i) => (
            <div key={i}>
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">{s.value}</div>
              <div className="text-xs text-[#86868b] uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1d1d1f] mb-8">Our Mission</h2>
          <div className="space-y-5 text-[17px] text-gray-600 leading-relaxed">
            <p>
              India has one of the youngest populations in the world and one of the most pressing set of social challenges — in education, environment, food security, health, and more. At the same time, there are millions of students and young professionals who genuinely want to contribute but have no reliable way to connect with the causes that need them.
            </p>
            <p>
              Kindly exists to close that gap. We are building the infrastructure for volunteering — the same way Swiggy built the infrastructure for food delivery or Ola built it for commuting. The goal is to make volunteering as easy, reliable, and habitual as ordering a meal.
            </p>
            <p>
              But unlike a food app, Kindly is also building a community. A place where doing good becomes a part of your identity. Where your volunteer hours tell a story. Where the people you meet on event day become people you volunteer with for years.
            </p>
            <p>
              We measure success not in downloads or revenue but in hours volunteered, certificates earned, and organisations that can now do more with the reliable human energy Kindly brings to them.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 px-6 bg-[#f5f5f7]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1d1d1f] mb-4">What we believe</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">These are not slogans. They are the principles that drive every product decision we make.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl">
                <div className={`w-12 h-12 ${v.bg} rounded-xl flex items-center justify-center mb-5`}>
                  <v.icon className={`w-6 h-6 ${v.color}`} />
                </div>
                <h3 className="text-lg font-bold text-[#1d1d1f] mb-3">{v.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story / Timeline */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1d1d1f] mb-12">Our Story</h2>
          <div className="space-y-0">
            {timeline.map((item, i) => (
              <div key={i} className="relative flex gap-8 pb-12 last:pb-0">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-[#1d1d1f] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  {i < timeline.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gray-100 mt-2" />
                  )}
                </div>
                <div className="pb-2">
                  <div className="text-xs font-bold text-[#86868b] uppercase tracking-wider mb-1">{item.year}</div>
                  <h3 className="text-xl font-bold text-[#1d1d1f] mb-3">{item.event}</h3>
                  <p className="text-gray-500 leading-relaxed text-[15px]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team / Founders Note */}
      <section className="py-24 px-6 bg-[#f5f5f7]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1d1d1f] mb-8">A Note from the Founder</h2>
          <div className="bg-white p-8 rounded-2xl shadow-sm">
            <p className="text-[17px] text-gray-600 leading-relaxed mb-6 italic">
              "I grew up in Nashik watching people do remarkable things quietly — planting trees, feeding strangers, teaching children after work hours. Nobody celebrated them. Nobody tracked what they did. And yet, the city is kinder because of them. Kindly is my attempt to give those people the recognition they deserve and to make it easier for more people to join them. It is the most important thing I've ever worked on."
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff6b6b] to-[#f59e0b] flex items-center justify-center text-white font-bold text-lg">
                M
              </div>
              <div>
                <div className="font-bold text-[#1d1d1f]">Manas Dhivare</div>
                <div className="text-sm text-gray-400">Founder, Kindly</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold text-[#1d1d1f] mb-4">Get in touch</h2>
          <p className="text-gray-500 mb-10 text-lg">We read every message. Whether you're a volunteer, an organisation, a journalist, or someone who just wants to say hello.</p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <a href="mailto:manasdhivare@gmail.com" className="flex items-center gap-3 text-[#1d1d1f] font-medium hover:text-gray-600 transition-colors">
              <Mail className="w-5 h-5 text-gray-400" />
              manasdhivare@gmail.com
            </a>
            <span className="text-gray-200 hidden sm:block">|</span>
            <div className="flex items-center gap-3 text-[#1d1d1f] font-medium">
              <MapPin className="w-5 h-5 text-gray-400" />
              Nashik, Maharashtra, India
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
