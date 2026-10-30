import type { Metadata } from "next"
import { LegalLayout, type LegalSection } from "@/components/marketing/legal"
import { MarketingShell } from "@/components/marketing/shell"

export const metadata: Metadata = {
  title: "Terms of use",
  description: "The terms that apply when you use KINDLY as a volunteer or an organization.",
}

// NOTE: the wording below is the platform's legal text. Change presentation here, but have counsel review any change to the words.
const SECTIONS: LegalSection[] = [
  {
    id: "acceptance",
    title: "Acceptance of Terms",
    body: (
      <p>By accessing or using KINDLY (kindly.co.in), you agree to be bound by these Terms of Use. If you do not agree, please do not use our platform.</p>
    ),
  },
  {
    id: "platform-role",
    title: "Platform Role & Limitation of Liability",
    body: (
      <>
        <p>KINDLY is a technology platform that facilitates connections between independent volunteers and third-party community organizations.</p>
        <ul>
          <li><strong>Assumption of Risk:</strong> We do not host, organize, or manage the physical events listed on the platform. By attending an event, you assume all physical and legal risks associated with it.</li>
          <li><strong>No Liability:</strong> KINDLY, its founders, and affiliates are not liable for any injury, loss, damage, or dispute that occurs during or as a result of a volunteering event.</li>
        </ul>
      </>
    ),
  },
  {
    id: "accounts",
    title: "User Accounts & Conduct",
    body: (
      <ul>
        <li><strong>Eligibility:</strong> You must have parental consent to use this platform.</li>
        <li><strong>Attendance & Reliability:</strong> Volunteers agree to honor their RSVPs. Repeated failure to attend registered events without cancellation will negatively impact your Reliability Score and may result in account suspension.</li>
        <li><strong>Prohibited Conduct:</strong> You may not use the platform to harass others, post fake events, scrape data, or violate any local, state, or national laws.</li>
      </ul>
    ),
  },
  {
    id: "organization-verification",
    title: "Organization Verification",
    body: (
      <p>Organizations are solely responsible for the safety, legality, and execution of their events. KINDLY reserves the right to remove any organization or event that violates our safety guidelines or community standards without prior notice.</p>
    ),
  },
  {
    id: "events-payments",
    title: "Events, Tickets & Payments",
    body: (
      <>
        <p>Most events on KINDLY are free. Where an organization charges a ticket price, the price is shown on the event page before you book and payment is processed by a third-party payment provider.</p>
        <ul>
          <li><strong>Platform Fee & Payouts:</strong> KINDLY deducts a platform fee from paid-event ticket revenue and pays the balance to the organization after the event is completed. KINDLY is not the organizer or seller of any event.</li>
          <li><strong>Refunds:</strong> If an organization cancels a paid event, registered volunteers are refunded. If a volunteer cancels, a full or partial refund may be available depending on how far in advance the cancellation is made.</li>
        </ul>
      </>
    ),
  },
  {
    id: "check-in-certificates",
    title: "Check-In, Hours & Certificates",
    body: (
      <ul>
        <li><strong>Check-In:</strong> Volunteers check in from the event venue, and KINDLY verifies their location against the location the organization set for the event. Organizations may also check volunteers in manually. Volunteer hours are recorded from check-in.</li>
        <li><strong>Certificates:</strong> Certificates are issued by the organization, not by KINDLY, to volunteers who attended. KINDLY provides the tools to issue and download them but does not guarantee that any college, employer, or other third party will accept a certificate.</li>
      </ul>
    ),
  },
  {
    id: "posts-content",
    title: "Posts & Content",
    body: (
      <ul>
        <li><strong>Your Content:</strong> Volunteers who attended an event can share photos, captions, and comments. You remain the owner of what you post and grant KINDLY a non-exclusive licence to display it on the platform. You can delete your posts at any time.</li>
        <li><strong>Your Responsibility:</strong> Only post content you have the right to share. Do not post photos of other people, and especially of children, without their consent or, for a child, the consent of their guardian. Do not post unlawful, harassing, misleading, or inappropriate content.</li>
        <li><strong>Moderation:</strong> KINDLY may remove content and suspend accounts that violate these terms.</li>
      </ul>
    ),
  },
  {
    id: "governing-law",
    title: "Governing Law",
    body: (
      <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Nashik, Maharashtra.</p>
    ),
  },
]

export default function TermsPage() {
  return (
    <MarketingShell>
      <LegalLayout title="Terms of Use" effective="October 30, 2026" sections={SECTIONS} />
    </MarketingShell>
  )
}
