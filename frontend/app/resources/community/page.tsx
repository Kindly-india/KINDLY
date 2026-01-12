"use client"

import { MessageCircle, Heart } from "lucide-react"

export default function CommunityPage() {
  return (
    <div className="bg-white min-h-screen pt-32 px-6 pb-20">
      <div className="max-w-4xl mx-auto text-center">
        <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Heart className="w-8 h-8 text-pink-600" />
        </div>
        <h1 className="text-4xl font-bold text-[#1d1d1f] mb-4">The Kindly Community</h1>
        <p className="text-lg text-gray-500 mb-12">
          A place for volunteers and organizers to share stories, ask questions, and support each other.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          <div className="border border-gray-200 p-8 rounded-2xl hover:border-black transition-colors cursor-pointer">
            <MessageCircle className="w-8 h-8 text-blue-600 mb-4" />
            <h3 className="text-xl font-bold text-[#1d1d1f] mb-2">Join the Discord</h3>
            <p className="text-gray-500">Connect with other volunteers in real-time. Share your experiences and get instant updates.</p>
          </div>
          <div className="border border-gray-200 p-8 rounded-2xl hover:border-black transition-colors cursor-pointer">
            <Heart className="w-8 h-8 text-rose-600 mb-4" />
            <h3 className="text-xl font-bold text-[#1d1d1f] mb-2">Code of Conduct</h3>
            <p className="text-gray-500">Read our guidelines to ensure Kindly remains a safe and welcoming space for everyone.</p>
          </div>
        </div>
      </div>
    </div>
  )
}