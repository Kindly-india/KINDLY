"use client"

import {
  Globe, Trophy, Users, Shield, QrCode, Heart, Zap, BookOpen,
  Star, MapPin, ChevronDown, CheckCircle2, ArrowLeft
} from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

const features = [
  {
    icon: Globe,
    color: "text-blue-600",
    bg: "bg-blue-50",
    title: "Events",
    body: "Discover hundreds of volunteering events in Nashik, and in future for Mumbai, Pune, Delhi, Bangalore, Chennai, Hyderabad, and Kolkata. Events are posted by verified NGOs and community groups — so every opportunity you see is real, vetted, and ready for you to show up."
  },
  {
    icon: Trophy,
    color: "text-amber-600",
    bg: "bg-amber-50",
    title: "Verified Digital Certificates",
    body: "Every event you attend earns you a digitally-signed certificate from the organisation. Each certificate is personalized with your name, event details, and volunteer hours. Download as PDF and add to your LinkedIn, resume, or college application. Certificates are generated automatically — no chasing required."
  },
  {
    icon: QrCode,
    color: "text-violet-600",
    bg: "bg-violet-50",
    title: "QR Check-In with Geo-Lock",
    body: "Check in by scanning the organisation's QR code at the venue. Our geo-lock system verifies you are physically at the location — within 200 metres — before confirming attendance. This makes your presence undeniable and your certificate credible. No proxy attendance, ever."
  },
  {
    icon: Users,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    title: "A Real Volunteer Community",
    body: "Your Kindly profile is your volunteer identity. Follow other volunteers, get endorsed for skills like teaching, logistics, or first aid, and see who you've crossed paths with across events. The social layer is built to make volunteering feel like belonging to something — not just attending an event."
  },
  {
    icon: Heart,
    color: "text-rose-600",
    bg: "bg-rose-50",
    title: "Track Your Impact Over Time",
    body: "Your profile automatically tracks every event you've attended, total volunteer hours, organisations you've worked with, and cause categories you've contributed to. Your impact history is public and shareable — a living proof of your commitment, not just a number on a dashboard."
  },
  {
    icon: Star,
    color: "text-orange-600",
    bg: "bg-orange-50",
    title: "Leave Reviews for Organisations",
    body: "After each event, you can rate the experience and leave an honest review for the organisation. This helps future volunteers make informed choices and pushes organisations to run better events. Your feedback directly improves the quality of volunteering for everyone."
  },
  {
    icon: BookOpen,
    color: "text-teal-600",
    bg: "bg-teal-50",
    title: "Skill-Based Discovery",
    body: "Tell Kindly your skills — photography, cooking, teaching, coding, first aid, carpentry, and more. Events that need your specific skills are surfaced first in your feed. Your time is valuable. We help you find where it makes the most difference."
  },
  {
    icon: Shield,
    color: "text-slate-600",
    bg: "bg-slate-50",
    title: "Only Verified Organisations",
    body: "Every organisation on Kindly is reviewed before their events go live. We check their mission, legitimacy, and past event history. You will never show up to an event that doesn't exist or isn't what it claimed to be. Your safety and your time are non-negotiable."
  },
  {
    icon: Zap,
    color: "text-purple-600",
    bg: "bg-purple-50",
    title: "Zero Friction Signup",
    body: "Create your profile in under 2 minutes. No lengthy approval process. No document uploads. Just your name, city, interests, and skills. Your first event registration can happen on the same day you sign up. We built Kindly for students and young professionals with busy schedules."
  },
  {
    icon: MapPin,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    title: "Hyper-Local Causes",
    body: "Kindly prioritises local impact. The events you see are happening in your neighbourhood and your city — not generic national campaigns. Whether it's planting trees in your ward, teaching at a local school, or helping at a community kitchen two streets away, Kindly keeps volunteering close to home."
  }
]

const faqs = [
  { q: "Do I need experience to volunteer?", a: "No. Most events on Kindly require only your time and willingness. Event listings clearly mention if any specific skills or qualifications are needed. If an event says 'open to all', no prior experience is required." },
  { q: "Can I volunteer if I'm a student?", a: "Absolutely. Kindly is built with students in mind. Our certificates are recognised by many colleges for community service hours. You can volunteer on weekends and build a portfolio of real impact for internship and placement interviews." },
  { q: "What happens if I cancel a registration?", a: "You can cancel any time before the event starts from your dashboard. The organisation is notified and your spot opens up for another volunteer. Cancellations do not affect your profile negatively. We only ask that you cancel as early as possible." },
  { q: "How do I get my certificate?", a: "Certificates are automatically generated once the organisation marks the event as complete. You will find it in your event history. Download it anytime — it never expires." },
  { q: "Is Kindly free?", a: "Yes, completely free for volunteers. There are no paid features, no premium tiers, and no hidden costs. Kindly's mission is access — we do not charge the people showing up to help." },
]

export default function ForVolunteersPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const router = useRouter()

  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="pt-32 pb-24 px-6 bg-gradient-to-b from-orange-50/60 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-start mb-6">
            <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-[#1d1d1f] transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
          <span className="text-orange-600 font-bold text-xs tracking-widest uppercase mb-5 block">For Volunteers</span>
          <h1 className="text-5xl md:text-7xl font-bold text-[#1d1d1f] mb-6 tracking-tight leading-[1.05]">
            Your time is<br />your superpower.
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Kindly turns the desire to help into a habit. Find events near you, show up, earn verified certificates, and build a volunteer identity that lasts beyond any single act of kindness.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/signup"
              className="h-12 px-8 bg-gradient-to-r from-[#ff6b6b] to-[#f59e0b] hover:opacity-90 text-white text-[15px] font-bold rounded-full inline-flex items-center justify-center transition-opacity"
            >
              Create Free Account
            </a>
            <a
              href="/events"
              className="h-12 px-8 bg-white border-2 border-gray-200 hover:border-gray-400 text-[#1d1d1f] text-[15px] font-bold rounded-full inline-flex items-center justify-center transition-colors"
            >
              Browse Events
            </a>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1d1d1f] mb-4">Everything you need to volunteer well</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">Kindly is not just an event directory. It is an end-to-end experience built around the volunteer's journey.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <div key={i} className="flex gap-5 p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#1d1d1f] mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Profile Section */}
      <section className="py-24 px-6 bg-[#f5f5f7]">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-[#1d1d1f] mb-6 leading-tight">Your volunteer profile. Your legacy.</h2>
              <p className="text-gray-500 leading-relaxed mb-6">
                Every event you attend enriches your Kindly profile. It is visible to other volunteers and organisations. Think of it as a portfolio of impact — not just a list of events, but proof that you are someone who shows up.
              </p>
              <div className="space-y-4">
                {[
                  "Total verified volunteer hours",
                  "Cause categories you support",
                  "Skills endorsed by your peers",
                  "Organisations you've worked with",
                  "Events you've attended",
                  "Followers in the Kindly community"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span className="text-[#1d1d1f] text-[15px]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center text-white text-2xl font-bold">A</div>
                <div>
                  <div className="font-bold text-[#1d1d1f] text-lg">Manas Dhivare</div>
                  <div className="text-sm text-gray-400">Nashik, Maharashtra</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[{ n: "34", l: "Events" }, { n: "142", l: "Hours" }, { n: "8", l: "Skills" }].map((s, i) => (
                  <div key={i} className="text-center p-3 bg-[#f5f5f7] rounded-xl">
                    <div className="text-xl font-bold text-[#1d1d1f]">{s.n}</div>
                    <div className="text-xs text-gray-400">{s.l}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {["Teaching", "Photography", "First Aid", "Logistics", "Cooking"].map((skill) => (
                  <span key={skill} className="text-xs px-3 py-1 bg-orange-50 text-orange-700 rounded-full font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1d1d1f] mb-12 text-center">Questions from volunteers</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left gap-4"
                >
                  <span className="font-semibold text-[#1d1d1f] text-[15px]">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-500 leading-relaxed text-[15px]">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-[#ff6b6b]/10 to-[#f59e0b]/10">
        <div className="max-w-2xl mx-auto text-center">
          <Heart className="w-12 h-12 mx-auto mb-6 text-rose-500" />
          <h2 className="text-4xl font-bold text-[#1d1d1f] mb-4">You belong here.</h2>
          <p className="text-gray-500 mb-8 text-lg">Join a community of people who don't just care — they show up.</p>
          <a
            href="/signup"
            className="h-12 px-10 bg-[#1d1d1f] hover:bg-black text-white text-[15px] font-bold rounded-full inline-flex items-center justify-center transition-colors"
          >
            Start Volunteering Today
          </a>
        </div>
      </section>
    </div>
  )
}
