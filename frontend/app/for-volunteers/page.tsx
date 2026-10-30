"use client"

import {
  Globe, Trophy, Users, Shield, Heart, Zap, BookOpen,
  Star, MapPin, Compass, ChevronDown, CheckCircle2, ArrowLeft
} from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const features = [
  {
    icon: Globe,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-500/15",
    title: "Events You Can Trust",
    body: "Browse upcoming volunteering events posted by verified NGOs and community groups, and see every detail before you commit — the venue, the on-site host, what to bring and what you'll be doing. Every organisation and every event is reviewed first, so what you see is real and ready for you to show up."
  },
  {
    icon: Trophy,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-500/15",
    title: "Verified Digital Certificates",
    body: "After an event, the organisation issues a certificate to everyone who attended — signed by the organisation and personalised with your name, the event details, your volunteer hours and a unique verification ID. Download it as a PDF and add it to your LinkedIn, resume, or college application."
  },
  {
    icon: MapPin,
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-500/15",
    title: "One-Tap Check-In with Geo-Lock",
    body: "On the day, open your ticket and tap Check In. Our geo-lock verifies you are physically at the venue — within 200 metres, once the event has started — before confirming attendance, and your volunteer hours are credited automatically. That makes your presence undeniable and your certificate credible."
  },
  {
    icon: Users,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-500/15",
    title: "A Real Volunteer Community",
    body: "Your Kindly profile is your volunteer identity. Follow other volunteers, get endorsed for skills like teaching, logistics, or first aid, and share your day with photos and a few words from events you attended. The social layer is built to make volunteering feel like belonging to something — not just attending an event."
  },
  {
    icon: Heart,
    color: "text-rose-600",
    bg: "bg-rose-50 dark:bg-rose-500/15",
    title: "Track Your Impact Over Time",
    body: "Your profile automatically tracks every event you've attended, total volunteer hours, organisations you've worked with, and cause categories you've contributed to. It's a living record of your commitment, not just a number on a dashboard — and you decide who sees it: keep your account public, or make it private and approve who follows you."
  },
  {
    icon: Star,
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-500/15",
    title: "Leave Reviews for Organisations",
    body: "After each event, you can rate the experience and leave an honest review for the organisation. This helps future volunteers make informed choices and pushes organisations to run better events. Your feedback directly improves the quality of volunteering for everyone."
  },
  {
    icon: BookOpen,
    color: "text-teal-600",
    bg: "bg-teal-50 dark:bg-teal-500/15",
    title: "Discovery Built Around You",
    body: "Tell Kindly which causes you care about — river clean-ups, teaching, animal rescue, art and more — and when you're free. Your feed is personalised around them, so your time goes where it makes the most difference. You can also search and filter by cause, date, time of day and duration."
  },
  {
    icon: Shield,
    color: "text-muted-foreground",
    bg: "bg-muted",
    title: "Only Verified Organisations",
    body: "Every organisation on Kindly is reviewed by our team before its events go live, and every event is reviewed too. Approved organisations can carry a verified badge on their profile, so you can show up with confidence. Your safety and your time matter."
  },
  {
    icon: Zap,
    color: "text-purple-600",
    bg: "bg-purple-50 dark:bg-purple-500/15",
    title: "Zero Friction Signup",
    body: "Sign in with an email one-time code, Google or a passkey — no password to remember. No lengthy approval process and no document uploads: just your name, interests and skills. Your first event registration can happen on the same day you sign up. We built Kindly for students and young professionals with busy schedules."
  },
  {
    icon: Compass,
    color: "text-cyan-600",
    bg: "bg-cyan-50 dark:bg-cyan-500/15",
    title: "Causes Close to Home",
    body: "Search events by place, see exactly where each one happens on a map before you commit, and pick the ones that fit your week. Whether it's planting trees, teaching at a local school, or helping at a community kitchen, Kindly keeps volunteering close to your life."
  }
]

const faqs = [
  { q: "Do I need experience to volunteer?", a: "No. Most events on Kindly require only your time and willingness. Event listings clearly mention if any specific skills or qualifications are needed. If an event says 'open to all', no prior experience is required." },
  { q: "Can I volunteer if I'm a student?", a: "Absolutely. Kindly is built with students in mind. Many colleges value community-service hours, and your certificates and verified hours give you something concrete to show. You can volunteer on weekends and build a portfolio of real impact for internship and placement interviews." },
  { q: "What happens if I cancel a registration?", a: "You can cancel any time before the event starts from your dashboard, and your spot opens up for another volunteer. Cancellations do not affect your profile negatively. We only ask that you cancel as early as possible." },
  { q: "How do I get my certificate?", a: "Once the event is over, the organisation issues certificates to everyone who attended. You'll find yours in your event history and can download it as a PDF any time." },
  { q: "Is Kindly free?", a: "Yes. Kindly is free for volunteers — no premium tiers and no hidden charges. Some organisations may charge a ticket price for workshops or special events; the price is shown on the event page before you book." },
]

export default function ForVolunteersPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const router = useRouter()

  return (
    <div className="bg-background min-h-screen">
      {/* Hero */}
      <section className="pt-32 pb-24 px-6 bg-gradient-to-b from-orange-50/60 dark:from-orange-50/10 to-white dark:to-background">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-start mb-6">
            <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
          <span className="text-orange-600 font-bold text-xs tracking-widest uppercase mb-5 block">For Volunteers</span>
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 tracking-tight leading-[1.05]">
            Your time is<br />your superpower.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Kindly turns the desire to help into a habit. Find events near you, show up, earn certificates and verified hours, and build a volunteer identity that lasts beyond any single act of kindness.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/signup"
              className="h-12 px-8 bg-gradient-to-r from-[#ff6b6b] to-[#f59e0b] hover:opacity-90 text-white text-[15px] font-bold rounded-full inline-flex items-center justify-center transition-opacity"
            >
              Create Free Account
            </a>
            <Link
              href="/events"
              className="h-12 px-8 bg-card border-2 border-border hover:border-border text-foreground text-[15px] font-bold rounded-full inline-flex items-center justify-center transition-colors"
            >
              Browse Events
            </Link>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Everything you need to volunteer well</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Kindly is not just an event directory. It is an end-to-end experience built around the volunteer&apos;s journey.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <div key={i} className="flex gap-5 p-6 rounded-2xl border border-border hover:border-border hover:shadow-sm transition-all">
                <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-foreground mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Profile Section */}
      <section className="py-24 px-6 bg-muted">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-6 leading-tight">Your volunteer profile. Your legacy.</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Every event you attend enriches your Kindly profile. It is visible to other volunteers and organisations unless you choose to make it private. Think of it as a portfolio of impact — not just a list of events, but proof that you are someone who shows up.
              </p>
              <div className="space-y-4">
                {[
                  "Total verified volunteer hours",
                  "Cause categories you support",
                  "Skills endorsed by organisations",
                  "Organisations you've worked with",
                  "Events you've attended",
                  "Followers in the Kindly community"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span className="text-foreground text-[15px]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="bg-card rounded-3xl p-6 shadow-sm border border-border">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center text-white text-2xl font-bold">A</div>
                  <div>
                    <div className="font-bold text-foreground text-lg">Ananya Iyer</div>
                    <div className="text-sm text-muted-foreground">Weekend volunteer</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[{ n: "7", l: "Events" }, { n: "22", l: "Hours" }, { n: "4", l: "Skills" }].map((s, i) => (
                    <div key={i} className="text-center p-3 bg-muted rounded-xl">
                      <div className="text-xl font-bold text-foreground">{s.n}</div>
                      <div className="text-xs text-muted-foreground">{s.l}</div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {["Teaching", "Photography", "Event Support", "Illustration"].map((skill) => (
                    <span key={skill} className="text-xs px-3 py-1 bg-orange-50 dark:bg-orange-500/15 text-orange-700 rounded-full font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">Illustrative sample profile</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Questions from volunteers</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-border rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left gap-4"
                >
                  <span className="font-semibold text-foreground text-[15px]">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6">
                    <p className="text-muted-foreground leading-relaxed text-[15px]">{faq.a}</p>
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
          <h2 className="text-4xl font-bold text-foreground mb-4">You belong here.</h2>
          <p className="text-muted-foreground mb-8 text-lg">Join a community of people who don&apos;t just care — they show up.</p>
          <a
            href="/signup"
            className="h-12 px-10 bg-primary hover:bg-primary text-primary-foreground text-[15px] font-bold rounded-full inline-flex items-center justify-center transition-colors"
          >
            Start Volunteering Today
          </a>
        </div>
      </section>
    </div>
  )
}
