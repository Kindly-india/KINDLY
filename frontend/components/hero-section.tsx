"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronRight, Eye, EyeOff, Heart, Building2, Sparkles, Users, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { OrgSignupWizard } from "./org-signup-wizard"
import { api } from "@/lib/api"
import Image from "next/image"
import { toast } from "sonner"

type UserType = "volunteer" | "organisation" | null

const cities = ["Nashik", "Mumbai", "Pune", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Kolkata"]

export function HeroSection() {
  const [selectedType, setSelectedType] = useState<UserType>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [city, setCity] = useState("Nashik")

  if (selectedType === "volunteer") {
    return (
      <section id="hero" className="min-h-screen bg-white md:bg-gradient-to-b md:from-orange-50 md:via-white md:to-green-50 relative overflow-x-hidden">
        
        {/* Hide floating icons on mobile for a cleaner form experience */}
        <div className="hidden md:flex absolute top-28 left-20 w-14 h-14 rounded-2xl bg-white shadow-lg items-center justify-center z-10">
          <Heart className="w-7 h-7 text-red-400" />
        </div>
        <div className="hidden md:flex absolute top-40 right-24 w-14 h-14 rounded-2xl bg-white shadow-lg items-center justify-center z-10">
          <Sparkles className="w-7 h-7 text-amber-500" />
        </div>

        <div className="flex items-start md:items-center justify-center px-4 md:px-6 pt-12 md:pt-24 pb-12 md:pb-20">
          <div className="w-full max-w-lg md:max-w-xl relative">
            
            <div className="relative bg-white md:bg-white/80 md:backdrop-blur-sm rounded-none md:rounded-3xl p-0 md:p-10 md:shadow-xl">
              {/* Back button */}
              <button
                onClick={() => setSelectedType(null)}
                className="flex items-center gap-1 text-sm font-bold text-gray-400 hover:text-gray-900 mb-6 md:mb-8 active:scale-95 transition-all p-2 -ml-2"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back
              </button>

              <h1 className="text-[28px] md:text-3xl font-bold text-gray-900 tracking-tight text-center">
                Join as a Volunteer
              </h1>
              <p className="text-[15px] md:text-base text-gray-500 text-center mt-2 mb-8 md:mb-10">
                Find opportunities that match your passion.
              </p>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!agreedToTerms) { alert('Please agree to terms'); return; }
                  const formData = new FormData(e.currentTarget);
                  try {
                    await api.signupVolunteer({
                      fullName: formData.get('name') as string,
                      email: formData.get('email') as string,
                      phone: formData.get('phone') as string,
                      password: formData.get('password') as string,
                      city,
                      interests: [],
                    });
                    toast.success("Check your email to verify your account.");
                  } catch (error: any) { toast.error(error.message || 'Signup failed.'); }
                }}
                className="space-y-5"
              >
                {/* Inputs: h-12 and text-[16px] for mobile optimization */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Full Name</Label>
                  <Input id="name" name="name" type="text" placeholder="John Doe" required className="h-12 md:h-12 bg-gray-50 md:bg-gray-100 border-0 rounded-xl text-[16px] md:text-base px-4" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="name@example.com" required className="h-12 md:h-12 bg-gray-50 md:bg-gray-100 border-0 rounded-xl text-[16px] md:text-base px-4" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Phone Number</Label>
                  <div className="flex gap-2">
                    <div className="h-12 md:h-12 px-4 bg-gray-50 md:bg-gray-100 rounded-xl flex items-center text-gray-500 font-bold shrink-0">+91</div>
                    <Input id="phone" name="phone" type="tel" placeholder="9876543210" required pattern="[0-9]{10}" className="flex-1 h-12 md:h-12 bg-gray-50 md:bg-gray-100 border-0 rounded-xl text-[16px] md:text-base px-4" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Password</Label>
                  <div className="relative">
                    <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Create a password" required minLength={6} className="h-12 md:h-12 bg-gray-50 md:bg-gray-100 border-0 rounded-xl text-[16px] md:text-base pl-4 pr-12" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 p-2">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">City</Label>
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger className="h-12 md:h-12 bg-gray-50 md:bg-gray-100 border-0 rounded-xl text-[16px] md:text-base px-4">
                      <SelectValue placeholder="Select your city" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {cities.map((c) => (
                        <SelectItem key={c} value={c} className="text-[16px] md:text-base rounded-lg">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                    className="mt-1 rounded border-gray-300 data-[state=checked]:bg-black data-[state=checked]:border-black w-5 h-5"
                  />
                  <Label htmlFor="terms" className="text-[13px] md:text-sm text-gray-500 leading-relaxed cursor-pointer">
                    I agree to the <a href="#" className="text-black font-bold hover:underline">Terms & Liability Waiver</a>
                  </Label>
                </div>

                <Button type="submit" disabled={!agreedToTerms} className="w-full h-12 md:h-14 bg-black text-white font-bold rounded-xl mt-4 active:scale-[0.98] transition-all">
                  Create Account
                </Button>
              </form>

              <div className="mt-8">
                <div className="relative flex justify-center text-sm mb-6">
                  <span className="bg-white px-4 text-[#86868b] text-[11px] font-bold uppercase tracking-wider">Or continue with</span>
                  <div className="absolute inset-0 flex items-center -z-10"><div className="w-full border-t border-gray-100"></div></div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                  <button className="h-12 w-full rounded-xl bg-white border border-[#d2d2d7] flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
                    <Image src="/google.jpg" alt="Google" width={20} height={20} className="object-contain" />
                    <span className="text-[15px] text-[#1d1d1f] font-bold">Google</span>
                  </button>
                  <button className="h-12 w-full rounded-xl bg-white border border-[#d2d2d7] flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
                    <svg className="w-5 h-5 text-[#1d1d1f]" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" /></svg>
                    <span className="text-[15px] text-[#1d1d1f] font-bold">Apple</span>
                  </button>
                </div>
              </div>

              <p className="text-center mt-8 text-[14px] text-gray-500 pb-6">
                Already a member? <Link href="/login" className="text-black font-bold hover:underline">Log in</Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (selectedType === "organisation") {
    return <OrgSignupWizard onBack={() => setSelectedType(null)} />
  }

  // DEFAULT VIEW
  return (
    <section id="hero" className="min-h-screen bg-white md:bg-gradient-to-b md:from-orange-50 md:via-white md:to-green-50 flex flex-col items-center justify-center px-4 md:px-6 py-12 md:py-20 relative overflow-x-hidden">
      
      <div className="mb-6 md:mb-8 animate-in fade-in zoom-in duration-500">
        <Image src="/logoblack.png" alt="Kindly Icon" width={80} height={80} className="w-16 h-16 md:w-20 md:h-20" priority />
      </div>

      <h1 className="text-[40px] md:text-6xl font-bold text-gray-900 tracking-tight text-center leading-[1.1]">
        Make a difference.
        <br />
        <span className="text-red-400">Start today.</span>
      </h1>

      <p className="text-base md:text-xl text-gray-500 text-center mt-4 md:mt-6 mb-10 md:mb-12 max-w-sm md:max-w-2xl font-medium">
        Join a growing community of volunteers making a real impact.
      </p>

      {/* Grid: 1 column on mobile for full-width cards, 2 columns on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full max-w-lg md:max-w-4xl">
        <button
          onClick={() => setSelectedType("volunteer")}
          className="group bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-sm md:shadow-lg border border-gray-100 hover:border-red-400/20 active:scale-[0.98] transition-all text-left"
        >
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-red-50 flex items-center justify-center mb-4 md:mb-6"><Heart className="w-6 h-6 md:w-7 md:h-7 text-red-400" /></div>
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">I'm a Volunteer</h3>
          <p className="text-sm md:text-base text-gray-500 leading-snug">Find meaningful opportunities to give back.</p>
          <div className="flex items-center gap-1 mt-4 text-red-400 font-bold">Get started <ChevronRight className="w-4 h-4" /></div>
        </button>

        <button
          onClick={() => setSelectedType("organisation")}
          className="group bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-sm md:shadow-lg border border-gray-100 hover:border-emerald-400/20 active:scale-[0.98] transition-all text-left"
        >
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 md:mb-6"><Building2 className="w-6 h-6 md:w-7 md:h-7 text-emerald-500" /></div>
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">I'm an Organisation</h3>
          <p className="text-sm md:text-base text-gray-500 leading-snug">Connect with passionate volunteers.</p>
          <div className="flex items-center gap-1 mt-2 md:mt-4 text-emerald-500 font-bold">Get started <ChevronRight className="w-4 h-4" /></div>
        </button>
      </div>

      <p className="mt-10 text-[14px] md:text-base text-gray-500 font-bold">
        Already have an account? <Link href="/login" className="text-red-400 hover:underline">Log in</Link>
      </p>
    </section>
  )
}