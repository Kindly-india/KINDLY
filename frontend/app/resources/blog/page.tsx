"use client"

export default function BlogPage() {
  const posts = [
    { title: "5 Ways to Volunteer Remotely", date: "Jan 10, 2026", cat: "Tips" },
    { title: "Impact Report: 2025 Year in Review", date: "Jan 01, 2026", cat: "News" },
    { title: "Spotlight: Green Earth NGO", date: "Dec 28, 2025", cat: "Stories" },
    { title: "Why Student Volunteering Matters", date: "Dec 15, 2025", cat: "Education" },
  ]

  return (
    <div className="bg-white min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-[#1d1d1f] mb-12">Kindly Blog</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-x-8 gap-y-12">
          {posts.map((post, i) => (
            <article key={i} className="group cursor-pointer">
              <div className="aspect-video bg-gray-100 rounded-2xl mb-4 overflow-hidden">
                {/* Placeholder for blog image */}
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">{post.cat}</span>
                <span className="text-xs text-gray-400">{post.date}</span>
              </div>
              <h2 className="text-2xl font-bold text-[#1d1d1f] group-hover:text-blue-600 transition-colors">{post.title}</h2>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}