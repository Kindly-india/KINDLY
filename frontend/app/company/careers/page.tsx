"use client"

import { ArrowUpRight } from "lucide-react"

export default function CareersPage() {
  const jobs = [
    { title: "Community Manager", type: "Full-time", location: "Nashik / Remote" },
    { title: "Senior React Developer", type: "Full-time", location: "Remote" },
    { title: "Growth Marketing Intern", type: "Internship", location: "Nashik" },
    { title: "UI/UX Designer", type: "Full-time", location: "Remote" },
  ]

  return (
    <div className="bg-white min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-20">
          <h1 className="text-5xl font-bold text-[#1d1d1f] mb-6">Join the team.</h1>
          <p className="text-xl text-gray-500">We are a small team doing big things. If you care about social impact and technology, you belong here.</p>
        </div>

        <div className="space-y-4">
          {jobs.map((job, i) => (
            <div key={i} className="group flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:border-black transition-all cursor-pointer bg-white">
              <div>
                <h3 className="text-lg font-bold text-[#1d1d1f] group-hover:text-blue-600 transition-colors">{job.title}</h3>
                <p className="text-gray-500 text-sm mt-1">{job.type} • {job.location}</p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-300 group-hover:text-black transition-colors" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}