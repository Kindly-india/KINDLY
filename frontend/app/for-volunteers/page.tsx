"use client"

import { Trophy, Users, Shield, Globe } from "lucide-react"

export default function ForVolunteersPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-orange-50/50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-orange-600 font-semibold text-sm tracking-wider uppercase mb-4 block">For Volunteers</span>
          <h1 className="text-5xl md:text-7xl font-bold text-[#1d1d1f] mb-6 tracking-tight">
            Make your time count.
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
            Find meaningful opportunities, track your contributions, and be part of a community that cares.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                <Globe className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#1d1d1f] mb-2">Local Opportunities</h3>
                <p className="text-gray-500 leading-relaxed">Discover events happening right in your neighborhood. From beach cleanups to food drives, help is needed everywhere.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <Trophy className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#1d1d1f] mb-2">Verified Certificates</h3>
                <p className="text-gray-500 leading-relaxed">Earn digital certificates for every hour you contribute. Great for students and professionals building their profile.</p>
              </div>
            </div>
          </div>
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#1d1d1f] mb-2">Community & Networking</h3>
                <p className="text-gray-500 leading-relaxed">Meet like-minded people. Volunteering is one of the best ways to make friends and professional connections.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#1d1d1f] mb-2">Safe & Secure</h3>
                <p className="text-gray-500 leading-relaxed">We vet all organizations on our platform to ensure your safety and that your time is used effectively.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}