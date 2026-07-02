"use client"

export default function PrivacyPage() {
  return (
    <div className="bg-background min-h-screen pb-24">
      {/* Header */}
      <section className="pt-32 pb-16 px-6 text-center bg-muted">
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Effective Date: April 13, 2026
        </p>
      </section>

      {/* Content */}
      <section className="pt-16 px-6">
        <div className="max-w-3xl mx-auto prose prose-lg prose-gray text-muted-foreground">
          <h2 className="text-2xl font-bold text-foreground mb-4">1. Introduction</h2>
          <p className="mb-8">
            Welcome to KINDLY ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and share your information when you use our website (kindly.co.in) and platform.
          </p>

          <h2 className="text-2xl font-bold text-foreground mb-4">2. Information We Collect</h2>
          <ul className="mb-8 space-y-2">
            <li><strong>Account Information:</strong> Name, email address, phone number, and profile picture when you register.</li>
            <li><strong>Activity Data:</strong> Event registrations, check-ins, volunteer hours logged, and your "Reliability Score."</li>
            <li><strong>Organization Data:</strong> Verification documents, registration numbers, and event details.</li>
            <li><strong>Automatically Collected Data:</strong> IP addresses and browser types collected via essential cookies for security.</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground mb-4">3. How We Use Your Information</h2>
          <ul className="mb-8 space-y-2">
            <li>To facilitate connections between volunteers and community organizations.</li>
            <li>To generate Impact Resumes and verify volunteer hours.</li>
            <li>To track and report aggregate volunteering data for Corporate Social Responsibility (CSR) compliance for partnering organizations.</li>
            <li>To maintain platform security and prevent fraudulent accounts.</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground mb-4">4. Sharing Your Information</h2>
          <p className="mb-4">
            <strong>With Organizations:</strong> When you register for an event, your basic profile (Name, Contact, Reliability Score) is shared with the hosting organization.<br/>
            <strong>For CSR Compliance:</strong> If your volunteering is sponsored by an employer, we may share your verified hours with them for compliance reporting.<br/>
            <strong>Legal Obligations:</strong> We may disclose data if required by Indian law.
          </p>
          <p className="mb-8 font-medium text-foreground">
            We will never sell your personal data to third-party advertisers.
          </p>

          <h2 className="text-2xl font-bold text-foreground mb-4">5. Data Security & Your Rights</h2>
          <p>
            Your data is securely stored using industry-standard encryption protocols. Under the Indian Digital Personal Data Protection (DPDP) Act, you have the right to access, correct, or request the deletion of your personal data at any time through your dashboard or by contacting us at hello@kindly.co.in.
          </p>
        </div>
      </section>
    </div>
  )
}