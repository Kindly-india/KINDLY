"use client"

export default function PressPage() {
  return (
    <div className="bg-white min-h-screen pt-32 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-[#1d1d1f] mb-4">Press & Media</h1>
        <p className="text-gray-500 mb-12">For inquiries, please contact <a href="mailto:manasdhivare@gmail.com" className="text-blue-600 underline">manasdhivare@gmail.com</a></p>
        
        <div className="bg-[#f5f5f7] p-8 rounded-2xl text-left">
          <h3 className="font-bold text-[#1d1d1f] mb-2">About Kindly</h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            Kindly is a social impact platform based in Nashik, India, dedicated to connecting volunteers with non-profit organizations. Founded in 2025, the platform has facilitated over 180,000 hours of community service.
          </p>
          <button className="text-sm font-bold text-black border-b border-black pb-0.5 hover:opacity-70">
            Download Brand Assets
          </button>
        </div>
      </div>
    </div>
  )
}