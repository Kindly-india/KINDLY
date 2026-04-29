"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronRight, Eye, EyeOff, Heart, Building2, Sparkles, Users, Star, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { OrgSignupWizard } from "./org-signup-wizard"
import { api } from "@/lib/api"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import { toast } from "sonner"

type UserType = "volunteer" | "organisation" | null

const cities = ["Nashik", "Mumbai", "Pune", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Kolkata"]

export function HeroSection() {
  const [selectedType, setSelectedType] = useState<UserType>(null)
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [resendDone, setResendDone] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [city, setCity] = useState("Nashik")

  if (selectedType === "volunteer") {
    if (verifiedEmail) {
      return (
        <section className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-md p-6">
            <div className="flex justify-center mb-4">
              <Mail className="w-12 h-12 text-[#80242a]" />
            </div>
            <h2 className="text-[20px] font-bold text-[#1d1d1f] text-center mb-2">Check your inbox</h2>
            <p className="text-[14px] text-[#6e6e73] text-center leading-relaxed mb-4">
              We sent a verification link to{" "}
              <span className="font-bold text-[#1d1d1f]">{verifiedEmail}</span>.
              {" "}Click it to activate your account.
            </p>
            <div className="bg-[#fffbeb] border border-[#fcd34d] rounded-xl p-3 mb-5 text-[13px] text-[#92400e] leading-relaxed">
              ⚠️ Can't find it? Check your{" "}
              <span className="font-bold">spam folder</span>. Mark it as{" "}
              <span className="font-bold">"Not spam"</span> so future emails reach your inbox directly.
            </div>
            <p className="text-[13px] text-[#6e6e73] text-center mb-4">
              Didn't receive it?{" "}
              <button
                disabled={resending || resendDone}
                onClick={async () => {
                  setResending(true)
                  await supabase.auth.resend({ type: "signup", email: verifiedEmail })
                  setResending(false)
                  setResendDone(true)
                }}
                className="text-[#80242a] font-semibold disabled:opacity-50 hover:underline"
              >
                {resendDone ? "Email sent!" : resending ? "Sending…" : "Resend email"}
              </button>
            </p>
            <p className="text-center">
              <Link href="/login" className="text-[13px] text-[#86868b] hover:underline">
                Back to sign in
              </Link>
            </p>
          </div>
        </section>
      )
    }

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
                    const email = formData.get('email') as string
                    await api.signupVolunteer({
                      fullName: formData.get('name') as string,
                      email,
                      password: formData.get('password') as string,
                      city,
                      interests: [],
                    });
                    setVerifiedEmail(email)
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