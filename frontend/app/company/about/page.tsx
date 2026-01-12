"use client"

export default function AboutPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="pt-32 pb-24 px-6 text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-[#1d1d1f] mb-8 tracking-tight">
          We believe in the power <br/> of <span className="italic font-serif text-gray-400">showing up.</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Kindly was born in Nashik with a simple idea: everyone wants to help, but not everyone knows how. We are building the infrastructure for kindness.
        </p>
      </section>

      {/* Values Grid */}
      <section className="py-20 bg-[#f5f5f7] px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Transparency", desc: "We verify every hour volunteered and every event hosted. Trust is our currency." },
              { title: "Community First", desc: "We build for the people on the ground. Technology is just the enabler." },
              { title: "Sustainable Impact", desc: "We focus on long-term engagement rather than one-off acts of charity." }
            ].map((value, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm">
                <h3 className="text-xl font-bold text-[#1d1d1f] mb-4">{value.title}</h3>
                <p className="text-gray-500 leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Text */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto prose prose-lg prose-gray">
          <h2 className="text-3xl font-bold text-[#1d1d1f] mb-6">Our Story</h2>
          <p className="mb-6">
            It started in 2025 when our founders realized that many NGOs in India struggle not with funding, but with manpower. On the other hand, thousands of students and professionals wanted to volunteer but couldn't find reliable opportunities.
          </p>
          <p>
            Kindly was created to bridge this gap. What began as a WhatsApp group in Nashik has now grown into a platform connecting over 50,000 volunteers with causes that matter.
          </p>
        </div>
      </section>
    </div>
  )
}