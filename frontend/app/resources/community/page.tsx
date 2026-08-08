"use client"

import { useState } from "react"
import { Instagram, MessageCircle, Heart, Shield, Users, ChevronDown, ExternalLink, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

const conductSections = [
  {
    title: "1. Respect Every Person",
    body: "The Kindly community includes volunteers from all backgrounds, ages, religions, castes, genders, and abilities. Treat every person — volunteer, organiser, or fellow community member — with basic human dignity. Discrimination, mockery, or exclusionary behaviour of any kind is not tolerated. We do not care how good your intentions are if the impact is harmful."
  },
  {
    title: "2. Show Up When You Commit",
    body: "Registering for an event and not showing up wastes an organisation's resources and takes a spot from someone who would have attended. If you cannot make it, cancel your registration in advance. Repeated no-shows without cancellation may result in restrictions on your account. Your word is your contribution."
  },
  {
    title: "3. Keep Reviews Honest and Constructive",
    body: "Event reviews are a public service. Write them as if the next volunteer depends on your honesty — because they do. Be fair, be specific, and be constructive. Do not leave reviews to settle personal scores, promote your own reputation, or attack an organisation for reasons unrelated to the volunteering experience itself."
  },
  {
    title: "4. No Unsolicited Promotion",
    body: "The Kindly community is not a platform for selling products, promoting personal brands, recruiting for unrelated causes, or spamming other members. Any form of unsolicited commercial messaging — in profiles, reviews, or community channels — will result in immediate removal. If you want to partner with Kindly, reach out to us directly."
  },
  {
    title: "5. Protect Vulnerable People",
    body: "Many volunteering events involve children, elderly individuals, and people in vulnerable circumstances. All volunteers are expected to maintain appropriate boundaries, never photograph beneficiaries without explicit consent, and never share private information about the communities they serve. The people we help are not content for social media. They are people."
  },
  {
    title: "6. Represent Kindly Well at Events",
    body: "When you show up as a Kindly volunteer, you represent the platform and every other volunteer on it. Be punctual, be professional, follow the organisation's instructions, and leave the venue better than you found it. You are a guest in the organisation's space and a representative of the broader volunteer community."
  },
  {
    title: "7. Report, Don't Retaliate",
    body: "If you witness misconduct — by a volunteer, organiser, or anyone else — report it to us at team@kindly.co.in. Do not attempt to handle it publicly or take personal action. We investigate every report seriously and maintain confidentiality. We will not tolerate retaliation against people who report in good faith."
  },
  {
    title: "8. Be Honest About Your Skills and Availability",
    body: "When listing skills on your profile, be accurate. When committing to a volunteer role that requires specific skills — first aid, driving, technical expertise — only accept if you genuinely have them. Organisations plan logistics based on volunteer profiles. Misrepresenting your capabilities creates real problems for real people."
  },
  {
    title: "9. Consequences",
    body: "Violations of this code of conduct may result in a warning, temporary suspension, or permanent removal from the Kindly platform depending on the severity. Decisions are made by the Kindly team and are final. We err on the side of protecting the community rather than accommodating repeat offenders."
  }
]

export default function CommunityPage() {
  const [openSection, setOpenSection] = useState<number | null>(null)
  const router = useRouter()

  return (
    <div className="bg-background min-h-screen">
      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center bg-gradient-to-b from-pink-50/50 dark:from-pink-50/10 to-white dark:to-background">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-start mb-6">
            <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
          <div className="w-14 h-14 bg-pink-100 dark:bg-pink-500/15 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Heart className="w-7 h-7 text-pink-600" />
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-4 tracking-tight">The Kindly Community</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A space for volunteers and organisers across India to connect, share, and keep each other accountable. Kindness is better when it&apos;s collective.
          </p>
        </div>
      </section>

      {/* Community Channels */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Join the conversation</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Instagram */}
            <a
              href="https://www.instagram.com/kindly.india?igsh=MWw2bHh1OW51NzQz&utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
              className="block border-2 border-border hover:border-pink-300 p-8 rounded-2xl transition-all group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-orange-400 rounded-xl flex items-center justify-center mb-5">
                <Instagram className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-pink-600 transition-colors">Follow on Instagram</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">Stories from the ground. Event highlights. Community moments. Follow <span className="font-medium text-foreground">@kindly.co.in</span> for the human side of volunteering.</p>
              <div className="flex items-center gap-1.5 text-pink-600 text-sm font-bold">
                <span>@kindly.india</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </a>

            {/* WhatsApp Community */}
            <div className="border-2 border-border p-8 rounded-2xl relative overflow-hidden hover:border-black transition-all">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/15 rounded-xl flex items-center justify-center mb-5">
                <MessageCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">WhatsApp Community</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                Get event announcements, impact updates, and community news directly on WhatsApp. One-way broadcast — no group chat noise.
              </p>
              <a
                href="https://chat.whatsapp.com/JLTD1iP3m8p63Mnz7SjISt"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 px-5 bg-emerald-600 text-white text-sm font-semibold rounded-full inline-flex items-center hover:bg-emerald-700 transition-colors"
              >
                Join Community
              </a>
            </div>

            {/* Community Guidelines teaser */}
            <div
              onClick={() => document.getElementById("code-of-conduct")?.scrollIntoView({ behavior: "smooth" })}
              className="border-2 border-border hover:border-border p-8 rounded-2xl transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mb-5">
                <Shield className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2 group-hover:underline">Code of Conduct</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Read the guidelines that keep Kindly a safe, honest, and welcoming space for everyone.</p>
            </div>

          </div>
        </div>
      </section>


      {/* What We're About */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">What this community stands for</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Kindly is not a spectator sport. Everyone here — volunteer, organiser, or supporter — is a participant.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-500/15", title: "Real Presence", desc: "We show up. Not for the photo. Not for the certificate. Because the people we serve deserve someone who is genuinely there." },
              { icon: Shield, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/15", title: "Honesty First", desc: "We review honestly, check in where we are, and represent our skills accurately. This community runs on trust." },
              { icon: Heart, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-500/15", title: "Long-Term Thinking", desc: "We are not here for one event. We are building a habit of showing up that lasts for years, not just for a weekend." }
            ].map((v, i) => (
              <div key={i} className="p-8 bg-muted rounded-2xl">
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

      {/* Code of Conduct */}
      <section id="code-of-conduct" className="py-24 px-6 bg-muted">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <Shield className="w-10 h-10 text-foreground mx-auto mb-4" />
            <h2 className="text-4xl font-bold text-foreground mb-4">Code of Conduct</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              By using Kindly — as a volunteer, an organisation, or a community member — you agree to these principles. They are not optional.
            </p>
          </div>

          <div className="space-y-3">
            {conductSections.map((section, i) => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenSection(openSection === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left gap-4"
                >
                  <span className="font-bold text-foreground text-[15px]">{section.title}</span>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${openSection === i ? "rotate-180" : ""}`} />
                </button>
                {openSection === i && (
                  <div className="px-6 pb-6">
                    <p className="text-muted-foreground leading-relaxed text-[15px]">{section.body}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-card rounded-2xl border border-border">
            <p className="text-sm text-muted-foreground leading-relaxed">
              This Code of Conduct applies to all Kindly-facilitated spaces — the platform, event venues, and any associated community channels. To report a violation or ask a question about these guidelines, email <a href="mailto:team@kindly.co.in" className="text-foreground font-medium underline">team@kindly.co.in</a>. Last updated: April 2026.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground mb-4">Be part of something real.</h2>
          <p className="text-muted-foreground mb-8 text-lg">Join thousands of volunteers building a kinder India — one event at a time.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/signup"
              className="h-12 px-8 bg-primary hover:bg-primary text-primary-foreground text-[15px] font-bold rounded-full inline-flex items-center justify-center transition-colors"
            >
              Join as a Volunteer
            </a>
            <a
              href="https://www.instagram.com/kindly.india?igsh=MWw2bHh1OW51NzQz&utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 px-8 border-2 border-border hover:border-pink-300 text-foreground text-[15px] font-bold rounded-full inline-flex items-center gap-2 justify-center transition-colors"
            >
              <Instagram className="w-4 h-4" />
              Follow on Instagram
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
