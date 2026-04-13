"use client"

export default function CookiesPage() {
  return (
    <div className="bg-white min-h-screen pb-24">
      {/* Header */}
      <section className="pt-32 pb-16 px-6 text-center bg-[#f5f5f7]">
        <h1 className="text-4xl md:text-6xl font-bold text-[#1d1d1f] mb-4 tracking-tight">
          Cookie Policy
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Effective Date: April 13, 2026
        </p>
      </section>

      {/* Content */}
      <section className="pt-16 px-6">
        <div className="max-w-3xl mx-auto prose prose-lg prose-gray text-gray-600">
          <h2 className="text-2xl font-bold text-[#1d1d1f] mb-4">1. What Are Cookies?</h2>
          <p className="mb-8">
            Cookies are small text files stored on your device when you visit a website. They help the website function properly and provide a better user experience.
          </p>

          <h2 className="text-2xl font-bold text-[#1d1d1f] mb-4">2. How We Use Cookies</h2>
          <p className="mb-4">KINDLY uses cookies primarily for essential platform functions:</p>
          <ul className="mb-8 space-y-2">
            <li><strong>Essential/Authentication Cookies:</strong> We use secure tokens to keep you logged into your account as you navigate between pages. Without these, the platform cannot function securely.</li>
            <li><strong>Preferences:</strong> To remember your UI choices, such as closing a banner or your active tab state.</li>
            <li><strong>Analytics:</strong> We use minimal, anonymized tracking to understand how many people visit our site and which pages are most popular. We do not use cross-site advertising trackers.</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#1d1d1f] mb-4">3. Managing Cookies</h2>
          <p className="mb-8">
            You can control or delete cookies through your browser settings. However, please note that disabling essential cookies will prevent you from logging into your KINDLY dashboard or registering for events.
          </p>

          <h2 className="text-2xl font-bold text-[#1d1d1f] mb-4">4. Updates</h2>
          <p>
            We may update this Cookie Policy occasionally to reflect changes in technology or legislation. Any changes will be posted on this page.
          </p>
        </div>
      </section>
    </div>
  )
}