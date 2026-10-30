"use client"

export default function TermsPage() {
  return (
    <div className="bg-background min-h-screen pb-24">
      {/* Header */}
      <section className="pt-32 pb-16 px-6 text-center bg-muted">
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 tracking-tight">
          Terms of Use
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Effective Date: October 30, 2026
        </p>
      </section>

      {/* Content */}
      <section className="pt-16 px-6">
        <div className="max-w-3xl mx-auto prose prose-lg prose-gray text-muted-foreground">
          <h2 className="text-2xl font-bold text-foreground mb-4">1. Acceptance of Terms</h2>
          <p className="mb-8">
            By accessing or using KINDLY (kindly.co.in), you agree to be bound by these Terms of Use. If you do not agree, please do not use our platform.
          </p>

          <h2 className="text-2xl font-bold text-foreground mb-4">2. Platform Role & Limitation of Liability</h2>
          <p className="mb-4">
            KINDLY is a technology platform that facilitates connections between independent volunteers and third-party community organizations. 
          </p>
          <ul className="mb-8 space-y-2">
            <li><strong>Assumption of Risk:</strong> We do not host, organize, or manage the physical events listed on the platform. By attending an event, you assume all physical and legal risks associated with it.</li>
            <li><strong>No Liability:</strong> KINDLY, its founders, and affiliates are not liable for any injury, loss, damage, or dispute that occurs during or as a result of a volunteering event.</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground mb-4">3. User Accounts & Conduct</h2>
          <ul className="mb-8 space-y-2">
            <li><strong>Eligibility:</strong> You must have parental consent to use this platform.</li>
            <li><strong>Attendance & Reliability:</strong> Volunteers agree to honor their RSVPs. Repeated failure to attend registered events without cancellation will negatively impact your Reliability Score and may result in account suspension.</li>
            <li><strong>Prohibited Conduct:</strong> You may not use the platform to harass others, post fake events, scrape data, or violate any local, state, or national laws.</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground mb-4">4. Organization Verification</h2>
          <p className="mb-8">
            Organizations are solely responsible for the safety, legality, and execution of their events. KINDLY reserves the right to remove any organization or event that violates our safety guidelines or community standards without prior notice.
          </p>

          <h2 className="text-2xl font-bold text-foreground mb-4">5. Events, Tickets & Payments</h2>
          <p className="mb-4">
            Most events on KINDLY are free. Where an organization charges a ticket price, the price is shown on the event page before you book and payment is processed by a third-party payment provider.
          </p>
          <ul className="mb-8 space-y-2">
            <li><strong>Platform Fee & Payouts:</strong> KINDLY deducts a platform fee from paid-event ticket revenue and pays the balance to the organization after the event is completed. KINDLY is not the organizer or seller of any event.</li>
            <li><strong>Refunds:</strong> If an organization cancels a paid event, registered volunteers are refunded. If a volunteer cancels, a full or partial refund may be available depending on how far in advance the cancellation is made.</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground mb-4">6. Check-In, Hours & Certificates</h2>
          <ul className="mb-8 space-y-2">
            <li><strong>Check-In:</strong> Volunteers check in from the event venue, and KINDLY verifies their location against the location the organization set for the event. Organizations may also check volunteers in manually. Volunteer hours are recorded from check-in.</li>
            <li><strong>Certificates:</strong> Certificates are issued by the organization, not by KINDLY, to volunteers who attended. KINDLY provides the tools to issue and download them but does not guarantee that any college, employer, or other third party will accept a certificate.</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground mb-4">7. Posts & Content</h2>
          <ul className="mb-8 space-y-2">
            <li><strong>Your Content:</strong> Volunteers who attended an event can share photos, captions, and comments. You remain the owner of what you post and grant KINDLY a non-exclusive licence to display it on the platform. You can delete your posts at any time.</li>
            <li><strong>Your Responsibility:</strong> Only post content you have the right to share. Do not post photos of other people, and especially of children, without their consent or, for a child, the consent of their guardian. Do not post unlawful, harassing, misleading, or inappropriate content.</li>
            <li><strong>Moderation:</strong> KINDLY may remove content and suspend accounts that violate these terms.</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground mb-4">8. Governing Law</h2>
          <p>
            These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Nashik, Maharashtra.
          </p>
        </div>
      </section>
    </div>
  )
}