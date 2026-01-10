"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronRight, Eye, EyeOff, Heart, Building2, Sparkles, Users, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { OrgSignupWizard } from "./org-signup-wizard"
import { api } from "@/lib/api"
import Image from "next/image"

type UserType = "volunteer" | "organisation" | null

const interests = ["Environment", "Education", "Health", "Animals", "Elderly Care", "Community"]
const cities = ["Nashik", "Mumbai", "Pune", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Kolkata"]

export function HeroSection() {
  const [selectedType, setSelectedType] = useState<UserType>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [city, setCity] = useState("Nashik")

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) => (prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]))
  }

  if (selectedType === "volunteer") {
    return (
      <section id="hero" className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-green-50 relative overflow-x-hidden">
        {/* Header */}
        <header className="md:hidden pt-4 pb-3 text-center px-4">
          <Link href="/" className="inline-flex items-center">
            <Image
              src="/logo.png"   // ✅ Correct: Points directly to the public folder root
              alt="Kindly"
              width={120}
              height={40}
              className="h-8 w-auto"
              priority
            />
          </Link>
        </header>

        <div className="absolute top-20 left-4 md:top-28 md:left-20 w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white shadow-lg flex items-center justify-center z-10">
          <Heart className="w-5 h-5 md:w-7 md:h-7 text-red-400" />
        </div>
        <div className="absolute top-32 right-4 md:top-40 md:right-24 w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white shadow-lg flex items-center justify-center z-10">
          <Sparkles className="w-5 h-5 md:w-7 md:h-7 text-amber-500" />
        </div>
        <div className="hidden md:flex absolute bottom-40 left-32 w-14 h-14 rounded-2xl bg-white shadow-lg items-center justify-center z-10">
          <Users className="w-7 h-7 text-blue-500" />
        </div>
        <div className="hidden md:flex absolute bottom-32 right-40 w-14 h-14 rounded-2xl bg-white shadow-lg items-center justify-center z-10">
          <Star className="w-7 h-7 text-emerald-500" />
        </div>

        <div className="flex items-start md:items-center justify-center px-4 md:px-6 pt-2 md:pt-24 pb-8 md:pb-20">
          <div className="w-full max-w-lg md:max-w-xl relative">
            {/* Decorative blur elements */}
            <div className="absolute -top-8 -left-8 md:-top-10 md:-left-10 w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-orange-200/40 to-red-200/40 rounded-full blur-2xl" />
            <div className="absolute -bottom-8 -right-8 md:-bottom-10 md:-right-10 w-20 h-20 md:w-28 md:h-28 bg-gradient-to-br from-emerald-200/40 to-pink-200/40 rounded-full blur-2xl" />

            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl md:rounded-3xl p-5 md:p-10 shadow-xl">
              {/* Back button */}
              <button
                onClick={() => setSelectedType(null)}
                className="absolute top-4 left-4 md:top-6 md:left-6 text-gray-500 hover:text-gray-900 transition-colors text-xs md:text-sm flex items-center gap-1"
              >
                <ChevronRight className="w-3 h-3 md:w-4 md:h-4 rotate-180" />
                Back
              </button>

              <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight text-center mt-4 md:mt-0">
                Join as a Volunteer
              </h1>
              <p className="text-xs md:text-base text-gray-500 text-center mt-1 md:mt-3 mb-4 md:mb-10">
                Find opportunities that match your passion.
              </p>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!agreedToTerms) {
                    alert('Please agree to the terms and conditions');
                    return;
                  }

                  const formData = new FormData(e.currentTarget);

                  try {
                    await api.signupVolunteer({
                      fullName: formData.get('name') as string,
                      email: formData.get('email') as string,
                      phone: formData.get('phone') as string,
                      password: formData.get('password') as string,
                      city,
                      interests: selectedInterests,
                    });

                    alert('Account created successfully! You can now log in.');
                    window.location.href = '/volunteer-home';
                  } catch (error: any) {
                    alert(error.message || 'Signup failed. Please try again.');
                  }
                }}
                className="space-y-2.5 md:space-y-5"
              >
                {/* Full Name */}
                <div className="space-y-0.5 md:space-y-2">
                  <Label htmlFor="name" className="text-xs text-gray-500 font-normal">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    required
                    className="h-9 md:h-12 bg-gray-100 border-0 rounded-lg md:rounded-xl text-sm md:text-base text-gray-900 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-red-400"
                  />
                </div>

                {/* Email */}
                <div className="space-y-0.5 md:space-y-2">
                  <Label htmlFor="email" className="text-xs text-gray-500 font-normal">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    className="h-9 md:h-12 bg-gray-100 border-0 rounded-lg md:rounded-xl text-sm md:text-base text-gray-900 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-red-400"
                  />
                </div>

                {/* Phone Number with +91 */}
                <div className="space-y-0.5 md:space-y-2">
                  <Label htmlFor="phone" className="text-xs text-gray-500 font-normal">
                    Phone Number
                  </Label>
                  <div className="flex gap-1.5 md:gap-2">
                    <div className="h-9 md:h-12 px-2.5 md:px-4 bg-gray-100 rounded-lg md:rounded-xl flex items-center text-gray-500 text-xs md:text-base font-medium shrink-0">
                      +91
                    </div>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="9876543210"
                      required
                      pattern="[0-9]{10}"
                      className="flex-1 h-9 md:h-12 bg-gray-100 border-0 rounded-lg md:rounded-xl text-sm md:text-base text-gray-900 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-red-400"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-0.5 md:space-y-2">
                  <Label htmlFor="password" className="text-xs text-gray-500 font-normal">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      required
                      minLength={6}
                      className="h-9 md:h-12 bg-gray-100 border-0 rounded-lg md:rounded-xl text-sm md:text-base text-gray-900 placeholder:text-gray-400 pr-9 md:pr-12 focus-visible:ring-2 focus-visible:ring-red-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 md:right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900"
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5 md:w-5 md:h-5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5 md:w-5 md:h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* City Dropdown */}
                <div className="space-y-0.5 md:space-y-2">
                  <Label htmlFor="city" className="text-xs text-gray-500 font-normal">
                    City
                  </Label>
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger className="h-9 md:h-12 bg-gray-100 border-0 rounded-lg md:rounded-xl text-sm md:text-base text-gray-900 focus:ring-2 focus:ring-red-400">
                      <SelectValue placeholder="Select your city" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {cities.map((c) => (
                        <SelectItem key={c} value={c} className="text-sm md:text-base rounded-lg">
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 md:space-y-3 pt-0.5 md:pt-2">
                  <Label className="text-xs text-gray-500 font-normal">Causes I care about</Label>
                  <div className="flex flex-wrap gap-1 md:gap-2">
                    {interests.map((interest) => {
                      const isSelected = selectedInterests.includes(interest)
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          className={cn(
                            "px-2 md:px-4 py-0.5 md:py-2 rounded-full text-xs md:text-base font-medium transition-all duration-200",
                            isSelected
                              ? "bg-gradient-to-r from-red-400 to-red-500 text-white shadow-md shadow-red-400/25"
                              : "bg-transparent border border-gray-300 text-gray-500 hover:border-red-400 hover:text-red-400",
                          )}
                        >
                          {interest}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Terms Checkbox */}
                <div className="flex items-start gap-2 md:gap-3 pt-0.5 md:pt-2">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                    className="mt-0.5 rounded border-gray-300 data-[state=checked]:bg-red-400 data-[state=checked]:border-red-400 w-3.5 h-3.5 md:w-4.5 md:h-4.5"
                  />
                  <Label
                    htmlFor="terms"
                    className="text-xs md:text-sm text-gray-500 leading-relaxed cursor-pointer"
                  >
                    I agree to the{" "}
                    <a href="#" className="text-red-400 hover:underline">
                      Terms & Liability Waiver
                    </a>
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={!agreedToTerms}
                  className="w-full h-9 md:h-12 bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white text-sm md:text-base font-medium rounded-full mt-2 md:mt-4 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-400/25"
                >
                  Create Account
                </Button>
              </form>

              {/* Social logins */}
              <div className="mt-4 md:mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white/80 px-3 md:px-4 text-gray-500 text-xs md:text-sm">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="flex justify-center gap-2 md:gap-4 mt-3 md:mt-6">
                  <button
                    type="button"
                    className="h-8 md:h-11 px-3 md:px-5 rounded-full bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md flex items-center justify-center gap-1.5 md:gap-2 transition-all"
                  >
                    <svg className="w-3.5 h-3.5 md:w-4.5 md:h-4.5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span className="text-xs md:text-sm text-gray-900 font-medium">Google</span>
                  </button>
                  <button
                    type="button"
                    className="h-8 md:h-11 px-3 md:px-5 rounded-full bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md flex items-center justify-center gap-1.5 md:gap-2 transition-all"
                  >
                    <svg
                      className="w-3.5 h-3.5 md:w-4.5 md:h-4.5 text-gray-900"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                    <span className="text-xs md:text-sm text-gray-900 font-medium">Apple</span>
                  </button>
                </div>
              </div>

              <p className="text-center mt-4 md:mt-8 text-xs md:text-sm text-gray-500">
                Already a member?{" "}
                <Link href="/login" className="text-red-400 hover:underline font-medium">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Organisation Sign-up (Full Wizard)
  if (selectedType === "organisation") {
    return <OrgSignupWizard onBack={() => setSelectedType(null)} />
  }

  // Default: User Type Selection
  return (
    <section
      id="hero"
      className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-green-50 flex flex-col items-center justify-center px-4 md:px-6 py-8 md:py-20 relative overflow-x-hidden"
    >
      <div className="absolute top-16 left-4 md:top-24 md:left-24 w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white shadow-lg flex items-center justify-center z-10">
        <Heart className="w-5 h-5 md:w-7 md:h-7 text-red-400" />
      </div>
      <div className="absolute top-24 right-4 md:top-32 md:right-28 w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white shadow-lg flex items-center justify-center z-10">
        <Sparkles className="w-5 h-5 md:w-7 md:h-7 text-amber-500" />
      </div>
      <div className="hidden md:flex absolute bottom-32 left-36 w-14 h-14 rounded-2xl bg-white shadow-lg items-center justify-center z-10">
        <Users className="w-7 h-7 text-blue-500" />
      </div>
      <div className="hidden md:flex absolute bottom-40 right-32 w-14 h-14 rounded-2xl bg-white shadow-lg items-center justify-center z-10">
        <Star className="w-7 h-7 text-emerald-500" />
      </div>

      <h1 className="text-3xl md:text-6xl font-semibold text-gray-900 tracking-tight text-center leading-tight">
        Make a difference.
        <br />
        <span className="bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent">Start today.</span>
      </h1>

      <p className="text-sm md:text-xl text-gray-500 text-center mt-3 md:mt-6 mb-6 md:mb-12 max-w-sm md:max-w-2xl">
        Join 10,000+ volunteers making an impact in their communities.
      </p>

      {/* User Type Cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-6 w-full max-w-lg md:max-w-4xl">
        {/* Volunteer Card */}
        <button
          onClick={() => setSelectedType("volunteer")}
          className="group relative bg-white rounded-xl md:rounded-3xl p-4 md:p-8 shadow-lg hover:shadow-2xl hover:shadow-red-400/20 transition-all duration-300 text-left border border-transparent hover:border-red-400/20"
        >
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-2xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center mb-3 md:mb-6 group-hover:scale-110 transition-transform">
            <Heart className="w-5 h-5 md:w-7 md:h-7 text-red-400" />
          </div>
          <h3 className="text-sm md:text-xl font-semibold text-gray-900 mb-1 md:mb-2">I'm a Volunteer</h3>
          <p className="text-xs md:text-base text-gray-500 leading-relaxed line-clamp-2">
            Find meaningful opportunities to give back.
          </p>
          <div className="flex items-center gap-1 mt-2 md:mt-4 text-red-400 text-xs md:text-base font-medium">
            Get started <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
          </div>
        </button>

        {/* Organisation Card */}
        <button
          onClick={() => setSelectedType("organisation")}
          className="group relative bg-white rounded-xl md:rounded-3xl p-4 md:p-8 shadow-lg hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 text-left border border-transparent hover:border-emerald-500/20"
        >
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center mb-3 md:mb-6 group-hover:scale-110 transition-transform">
            <Building2 className="w-5 h-5 md:w-7 md:h-7 text-emerald-500" />
          </div>
          <h3 className="text-sm md:text-xl font-semibold text-gray-900 mb-1 md:mb-2">I'm an Organisation</h3>
          <p className="text-xs md:text-base text-gray-500 leading-relaxed line-clamp-2">
            Connect with passionate volunteers.
          </p>
          <div className="flex items-center gap-1 mt-2 md:mt-4 text-emerald-500 text-xs md:text-base font-medium">
            Get started <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
          </div>
        </button>
      </div>

      <p className="text-center mt-6 md:mt-10 text-xs md:text-base text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="text-red-400 hover:underline font-medium">
          Log in
        </Link>
      </p>
    </section>
  )
}