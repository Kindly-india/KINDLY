"use client"

export default function TermsPage() {
  return (
    <div className="bg-white min-h-screen pb-24">
      {/* Header */}
      <section className="pt-32 pb-16 px-6 text-center bg-[#f5f5f7]">
        <h1 className="text-4xl md:text-6xl font-bold text-[#1d1d1f] mb-4 tracking-tight">
          Terms of Use
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Effective Date: April 13, 2026
        </p>
      </section>

      {/* Content */}
      <section className="pt-16 px-6">
        <div className="max-w-3xl mx-auto prose prose-lg prose-gray text-gray-600">
          <h2 className="text-2xl font-bold text-[#1d1d1f] mb-4">1. Acceptance of Terms</h2>
          <p className="mb-8">
            By accessing or using KINDLY (kindly.co.in), you agree to be bound by these Terms of Use. If you do not agree, please do not use our platform.
          </p>

          <h2 className="text-2xl font-bold text-[#1d1d1f] mb-4">2. Platform Role & Limitation of Liability</h2>
          <p className="mb-4">
            KINDLY is a technology platform that facilitates connections between independent volunteers and third-party community organizations. 
          </p>
          <ul className="mb-8 space-y-2">
            <li><strong>Assumption of Risk:</strong> We do not host, organize, or manage the physical events listed on the platform. By attending an event, you assume all physical and legal risks associated with it.</li>
            <li><strong>No Liability:</strong> KINDLY, its founders, and affiliates are not liable for any injury, loss, damage, or dispute that occurs during or as a result of a volunteering event.</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1d1d1f] mb-4">3. User Accounts & Conduct</h2>
          <ul className="mb-8 space-y-2">
            <li><strong>Eligibility:</strong> You must have parental consent, to use this platform.</li>
            <li><strong>Attendance & Reliability:</strong> Volunteers agree to honor their RSVPs. Repeated failure to attend registered events without cancellation will negatively impact your Reliability Score and may result in account suspension.</li>
            <li><strong>Prohibited Conduct:</strong> You may not use the platform to harass others, post fake events, scrape data, or violate any local, state, or national laws.</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1d1d1f] mb-4">4. Organization Verification</h2>
          <p className="mb-8">
            Organizations are solely responsible for the safety, legality, and execution of their events. KINDLY reserves the right to remove any organization or event that violates our safety guidelines or community standards without prior notice.
          </p>

          <h2 className="text-2xl font-bold text-[#1d1d1f] mb-4">5. Governing Law</h2>
          <p>
            These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Nashik, Maharashtra.
          </p>
        </div>
      </section>
    </div>
  )
}