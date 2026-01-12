"use client"

import { Search, ChevronRight } from "lucide-react"

export default function HelpCenterPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="bg-[#1d1d1f] py-24 px-6 text-center text-white">
        <h1 className="text-3xl font-bold mb-6">How can we help?</h1>
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search for articles..." 
            className="w-full h-12 pl-12 pr-4 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:bg-white/20 transition-all"
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-bold text-[#1d1d1f] mb-4 text-lg">Getting Started</h3>
            <ul className="space-y-3">
              {["How to create an account", "Verifying your identity", "Resetting password"].map(item => (
                <li key={item} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer group text-gray-600">
                  {item} <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-black" />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-[#1d1d1f] mb-4 text-lg">For Volunteers</h3>
            <ul className="space-y-3">
              {["How to register for events", "Downloading certificates", "Tracking hours"].map(item => (
                <li key={item} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer group text-gray-600">
                  {item} <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-black" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}