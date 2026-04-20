"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CareersPage() {
  const router = useRouter()
  const jobs = [
    { 
      title: "Culture & Social Media Lead", 
      type: "Part-time / Equity", 
      location: "Nashik / Remote",
      description: "Own the KINDLY aesthetic on Instagram and TikTok. Make volunteering look like a high-status, exclusive movement, not a chore."
    },
    { 
      title: "Head of NGO Partnerships", 
      type: "Full-time", 
      location: "Nashik",
      description: "Sit with foundation directors and local government officials to bring exclusive, high-impact events onto the platform."
    },
    { 
      title: "Videographer & Content Creator", 
      type: "Freelance / Project", 
      location: "Nashik",
      description: "Capture cinematic reels of our community in action. Show the sweat, the laughs, and the real-world impact."
    },
    { 
      title: "Founding Campus Ambassador", 
      type: "Internship", 
      location: "Multiple Campuses",
      description: "Be the face of KINDLY at your college. Get your peers, local clubs, and Rotaract members to download the app and show up."
    },
  ]

  return (
    <div className="bg-white min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-[#1d1d1f] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        {/* Header Section */}
        <div className="mb-20">
          <h1 className="text-5xl font-bold text-[#1d1d1f] mb-6">Join the team.</h1>
          <p className="text-xl text-gray-500">We are building the infrastructure for civic action. If you care about social impact, scale, and high-end design, you belong here.</p>
        </div>

        {/* Roles List (Static, Non-Clickable) */}
        <div className="space-y-4 mb-20">
          {jobs.map((job, i) => (
            <div key={i} className="p-6 border border-gray-200 rounded-xl bg-white">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-2">
                <h3 className="text-xl font-bold text-[#1d1d1f]">{job.title}</h3>
                <span className="text-xs font-medium px-3 py-1 bg-gray-100 text-gray-600 rounded-full whitespace-nowrap">
                  {job.type}
                </span>
              </div>
              <p className="text-gray-500 text-sm mb-4 max-w-2xl">{job.description}</p>
              <p className="text-gray-400 text-xs tracking-wide uppercase font-semibold">{job.location}</p>
            </div>
          ))}
        </div>

        {/* The Call to Action (CTA) Box */}
        <div className="bg-[#f5f5f7] rounded-3xl p-10 text-center">
          <h3 className="text-2xl font-bold text-[#1d1d1f] mb-4">How to apply</h3>
          <p className="text-gray-600 mb-8 max-w-lg mx-auto">
            We don't care about traditional resumes. If you want to claim one of these roles, send us an email. Show us your portfolio, link your Instagram, or just write a paragraph telling us why you get the vision.
          </p>
          <a 
            href="mailto:manasdhivare@gmail.com" 
            className="inline-block bg-[#1d1d1f] text-white font-medium px-8 py-3 rounded-full hover:bg-black transition-colors"
          >
            Email the Founders
          </a>
        </div>

      </div>
    </div>
  )
}