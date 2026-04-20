"use client"

import { Download, Mail, ArrowUpRight, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function PressPage() {
  const router = useRouter()

  return (
    <div className="bg-white min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-[#1d1d1f] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        {/* Hero Section */}
        <div className="mb-20">
          <h1 className="text-5xl font-bold text-[#1d1d1f] mb-6">Press & Media.</h1>
          <p className="text-xl text-gray-500 max-w-2xl">
            Everything you need to write about KINDLY. For interview requests, data inquiries, or additional assets, please reach out to our team.
          </p>
        </div>

        {/* Quick Facts / Boilerplate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
          <div>
            <h2 className="text-2xl font-bold text-[#1d1d1f] mb-4">About KINDLY</h2>
            <p className="text-gray-600 leading-relaxed">
              KINDLY is a social impact platform dedicated to eliminating the friction in civic engagement. We build the digital infrastructure that connects volunteers with verified non-profit organizations, turning intention into measurable real-world action.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 bg-[#f5f5f7] p-8 rounded-3xl">
            <div>
              <h4 className="text-4xl font-bold text-[#1d1d1f] mb-1">100%</h4>
              <p className="text-sm text-gray-500 font-medium">Verified NGOs</p>
            </div>
            <div>
              <h4 className="text-4xl font-bold text-[#1d1d1f] mb-1">2025</h4>
              <p className="text-sm text-gray-500 font-medium">Year Founded</p>
            </div>
            <div>
              <h4 className="text-xl font-bold text-[#1d1d1f] mb-1 pt-4">Nashik, IN</h4>
              <p className="text-sm text-gray-500 font-medium">Headquarters</p>
            </div>
            <div>
              <h4 className="text-xl font-bold text-[#1d1d1f] mb-1 pt-4">Tech</h4>
              <p className="text-sm text-gray-500 font-medium">Sector</p>
            </div>
          </div>
        </div>

        {/* Assets & Contact Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Brand Assets Card */}
          <div className="border border-gray-200 rounded-3xl p-10 hover:border-black transition-all group cursor-pointer flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Download className="w-5 h-5 text-[#1d1d1f]" />
              </div>
              <h3 className="text-2xl font-bold text-[#1d1d1f] mb-3">Brand Assets</h3>
              <p className="text-gray-500 mb-8">
                Download official high-resolution logos, product screenshots, and founder headshots for your publications.
              </p>
            </div>
            <div className="flex items-center text-[#1d1d1f] font-medium">
              <span className="group-hover:mr-2 transition-all">Download .ZIP</span>
              <ArrowUpRight className="w-5 h-5 ml-1" />
            </div>
          </div>

          {/* Press Contact Card */}
          <div className="bg-[#1d1d1f] rounded-3xl p-10 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-6">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Press Inquiries</h3>
              <p className="text-gray-400 mb-8">
                Skip the generic forms. Email the founding team directly for quotes, interviews, or exclusive data.
              </p>
            </div>
            <a href="mailto:manasdhivare@gmail.com" className="inline-block bg-white text-[#1d1d1f] font-medium px-8 py-3 rounded-full hover:bg-gray-100 transition-colors self-start">
              Email Us
            </a>
          </div>

        </div>

      </div>
    </div>
  )
}