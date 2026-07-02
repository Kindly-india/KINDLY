"use client"

import { Heart, Globe, Shield, TrendingUp, Users, Zap, Mail, MapPin, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

const values = [
  {
    icon: Shield,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-500/15",
    title: "Integrity over optics",
    desc: "Every hour volunteered on Kindly is verified. Every attendance record is geo-confirmed. We built verification into the foundation because credibility — for volunteers and organisations alike — is the only thing worth building on."
  },
  {
    icon: Heart,
    color: "text-rose-600",
    bg: "bg-rose-50 dark:bg-rose-500/15",
    title: "Community before product",
    desc: "Kindly is a product, but it is more importantly a community. The decisions we make about features, design, and policy start with one question: does this make it easier or harder for someone to show up and help? Technology is just the enabler."
  },
  {
    icon: TrendingUp,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-500/15",
    title: "Long-term impact",
    desc: "One-off charity drives create feel-good moments. Long-term volunteering creates change. Kindly is built to turn a first-time volunteer into a habitual one — through recognition, community, and a profile that grows with every event attended."
  },
  {
    icon: Globe,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-500/15",
    title: "Hyper-local, not generic",
    desc: "The most powerful act of kindness is one that happens in your neighbourhood. Kindly does not aggregate national campaigns — it connects you to causes within your city, your ward, your community. Local problems need local people."
  },
  {
    icon: Zap,
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-500/15",
    title: "Friction is the enemy",
    desc: "The number one reason people don't volunteer is not lack of desire — it's lack of a clear, easy path. Every design decision on Kindly is made to reduce friction: fewer steps, no gatekeeping, no bureaucracy. Showing up should be simple."
  },
  {
    icon: Users,
    color: "text-teal-600",
    bg: "bg-teal-50 dark:bg-teal-500/15",
    title: "Transparency by default",
    desc: "Every organisation on Kindly is verified. Every volunteer's history is honest. Reviews are real. Attendance is factual. Kindly does not allow self-reported hours or unverified certificates. Trust is built by showing the truth, not curating it."
  }
]

const timeline = [
  { year: "End 2025", event: "The idea", desc: "I noticed that local Community Organisations struggle not with funding but with reliable manpower. Meanwhile, thousands of students and young professionals in the city want to contribute but cannot find vetted opportunities. The idea for Kindly is written on a notebook." },
  { year: "Early 2026", event: "First version", desc: "I worked in some organisations to find out that events are created and carried out manually. Attendance is tracked on paper." },
  { year: "Early 2026", event: "Platform launch", desc: "That’s when I brought the idea in my head to life, and kindly was created. Kindly is a full platform — event creation, volunteer profiles, QR check-in, and certificate generation. Organisations in Nashik." },
  { year: "Vision for 2026 Onwards", event: "Expanding across India", desc: "Kindly should open to 8 Indian cities. 50,000 volunteers. 1,200+ events hosted. The geo-lock verification system is introduced, making certificates credible enough to be accepted by colleges and employers. This is just the beginning." }
]


export default function AboutPage() {
  const router = useRouter()

  return (
    <div className="bg-background min-h-screen">

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-start mb-6">
            <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5 block">About Kindly</span>
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-8 tracking-tight leading-[1.05]">
            We believe in the power<br />of{" "}
            <span className="italic font-serif text-muted-foreground">showing up.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Kindly is a volunteering platform built for Indian cities. We connect people who want to help with organisations that need them — and we verify every step of the way. Not because we don't trust people. Because trust is what makes impact real.
          </p>
        </div>
      </section>


      {/* Mission */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-8">Our Mission</h2>
          <div className="space-y-5 text-[17px] text-muted-foreground leading-relaxed">
            <p>
              India has one of the youngest populations in the world and one of the most pressing set of social challenges — in education, environment, food security, health, and more. At the same time, there are millions of students and young professionals who genuinely want to contribute but have no reliable way to connect with the causes that need them.
            </p>
            <p>
              Kindly exists to close that gap. We are building the infrastructure for volunteering. The goal is to make volunteering as easy, reliable, and habitual as ordering a meal.
            </p>
            <p>
              Kindly is also building a community. A place where doing good becomes a part of your identity. Where your volunteer hours tell a story. Where the people you meet on event day become people you associate with for years.
            </p>
            <p>
              We measure success not in downloads or revenue but in hours volunteered, certificates earned, and organisations that can now do more with the reliable human energy Kindly brings to them.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 px-6 bg-muted">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">What we believe</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">These are not slogans. They are the principles that drive every product decision we make.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <div key={i} className="bg-card p-8 rounded-2xl">
                <div className={`w-12 h-12 ${v.bg} rounded-xl flex items-center justify-center mb-5`}>
                  <v.icon className={`w-6 h-6 ${v.color}`} />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-3">{v.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story / Timeline */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-12">Our Story</h2>
          <div className="space-y-0">
            {timeline.map((item, i) => (
              <div key={i} className="relative flex gap-8 pb-12 last:pb-0">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  {i < timeline.length - 1 && (
                    <div className="w-0.5 flex-1 bg-muted mt-2" />
                  )}
                </div>
                <div className="pb-2">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{item.year}</div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{item.event}</h3>
                  <p className="text-muted-foreground leading-relaxed text-[15px]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team / Founders Note */}
      <section className="py-24 px-6 bg-muted">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-8">A Note from the Founder</h2>
          <div className="bg-card p-8 rounded-2xl shadow-sm">
            <p className="text-[17px] text-muted-foreground leading-relaxed mb-6 italic">
              The real work in this city has always been done quietly. I watched people build communities after their 9-to-5s without asking for a microphone. But today, good intentions get lost in the noise. KINDLY is our answer to that. We built a platform that turns intent into measurable, real-world action. It’s for the people who actually want to show up, not just talk about it.
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff6b6b] to-[#f59e0b] flex items-center justify-center text-white font-bold text-lg">
                MD
              </div>
              <div>
                <div className="font-bold text-foreground">Manas Dhivare</div>
                <div className="text-sm text-muted-foreground">Founder, Kindly</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground mb-4">Get in touch</h2>
          <p className="text-muted-foreground mb-10 text-lg">We read every message. Whether you're a volunteer, an organisation, a journalist, or someone who just wants to say hello.</p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <a href="mailto:manasdhivare@gmail.com" className="flex items-center gap-3 text-foreground font-medium hover:text-muted-foreground transition-colors">
              <Mail className="w-5 h-5 text-muted-foreground" />
              manasdhivare@gmail.com
            </a>
            <span className="text-muted-foreground hidden sm:block">|</span>
            <div className="flex items-center gap-3 text-foreground font-medium">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              Nashik, Maharashtra, India
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
