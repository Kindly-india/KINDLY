"use client"

import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/hero-section"
import { AboutSection } from "@/components/about-section"
import { ImpactSection } from "@/components/impact-section"
import { HowItWorksSection } from "@/components/how-it-works-section"
import { TestimonialsSection } from "@/components/testimonials-section"
import { EventsSection } from "@/components/events-section"
import { ContactSection } from "@/components/contact-section"

export function LandingPage() {
  return (
    <main className="min-h-screen bg-background dark:bg-black">
      <Navigation />
      <HeroSection />
      <ImpactSection />
      <AboutSection />
      <HowItWorksSection />
      <EventsSection />
      <TestimonialsSection />
      <ContactSection />
    </main>
  )
}
