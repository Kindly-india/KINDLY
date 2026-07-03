import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly resend: Resend | null;
  private readonly logger = new Logger(EmailService.name);
  private readonly from = 'KINDLY <team@kindly.co.in>';

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.resend = null;
      this.logger.warn('RESEND_API_KEY not set — email sending is disabled');
    }
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.resend) return;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await this.resend.emails.send({ from: this.from, to, subject, html });
        return;
      } catch (err: any) {
        if (attempt === 3) {
          this.logger.error(
            `Failed to send email to ${to} after 3 attempts: ${err?.message}`,
            err?.stack,
          );
          return;
        }
        await new Promise(r => setTimeout(r, 500 * attempt));
      }
    }
  }

  // ─── Public send methods ──────────────────────────────────────────────────

  async sendWelcomeEmail(
    to: string,
    name: string,
    type: 'volunteer' | 'org',
  ): Promise<void> {
    const subject =
      type === 'volunteer'
        ? 'Welcome to KINDLY — your impact journey starts now'
        : 'Your KINDLY application has been received';
    const html =
      type === 'volunteer'
        ? this.volunteerWelcomeHtml(name)
        : this.orgWelcomeHtml(name);
    await this.send(to, subject, html);
  }

  async sendRSVPConfirmation(
    to: string,
    name: string,
    eventTitle: string,
    eventDate: string,
    eventLocation: string,
  ): Promise<void> {
    await this.send(
      to,
      `You're registered — ${eventTitle}`,
      this.rsvpHtml(name, eventTitle, eventDate, eventLocation),
    );
  }

  async sendEventCancellation(
    to: string,
    name: string,
    eventTitle: string,
    eventDate: string,
    eventLocation: string,
  ): Promise<void> {
    await this.send(
      to,
      `Action Required: ${eventTitle} has been cancelled`,
      this.eventCancelledHtml(name, eventTitle, eventDate, eventLocation),
    );
  }

  /** Template-ready; trigger via cron job when event is 24 h away. */
  async sendEventReminder(
    to: string,
    name: string,
    eventTitle: string,
    eventDate: string,
    eventLocation: string,
  ): Promise<void> {
    await this.send(
      to,
      `Reminder: You're volunteering at ${eventTitle} tomorrow`,
      this.eventReminderHtml(name, eventTitle, eventDate, eventLocation),
    );
  }

  async sendAdminCancellationAlert(
    eventTitle: string,
    orgName: string,
    eventDate: string,
    location: string,
  ): Promise<void> {
    const ADMINS = ['manasdhivare@gmail.com', 'adityamohandhongade@gmail.com'];
    const formattedDate = eventDate
      ? new Date(eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'Unknown date';

    const html = this.base(
      `[KINDLY OPS] Event Cancelled — ${eventTitle}`,
      `<div style="display:inline-block;background:#fff1f2;border-radius:100px;padding:6px 16px;margin-bottom:20px;">
         <span style="font-size:13px;font-weight:600;color:#e11d48;">⚠ Cancellation Alert</span>
       </div>
       <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1d1d1f;letter-spacing:-0.5px;">An event has been cancelled.</h1>
       <p style="margin:0 0 24px;font-size:15px;color:#86868b;line-height:1.6;">
         An organisation just cancelled a published event on KINDLY. Review below.
       </p>
       <div style="border:1px solid #fecdd3;border-radius:12px;overflow:hidden;margin-bottom:28px;">
         <div style="background:#e11d48;padding:16px 20px;">
           <p style="margin:0;font-size:16px;font-weight:700;color:#ffffff;">${eventTitle}</p>
         </div>
         <div style="padding:16px 20px;background:#fff1f2;">
           <table cellpadding="0" cellspacing="0">
             <tr>
               <td style="padding:4px 0;font-size:13px;color:#86868b;padding-right:16px;white-space:nowrap;">Organisation</td>
               <td style="padding:4px 0;font-size:13px;font-weight:600;color:#1d1d1f;">${orgName}</td>
             </tr>
             <tr>
               <td style="padding:4px 0;font-size:13px;color:#86868b;padding-right:16px;white-space:nowrap;">Was scheduled</td>
               <td style="padding:4px 0;font-size:13px;font-weight:600;color:#1d1d1f;">${formattedDate}</td>
             </tr>
             <tr>
               <td style="padding:4px 0;font-size:13px;color:#86868b;padding-right:16px;white-space:nowrap;">Location</td>
               <td style="padding:4px 0;font-size:13px;font-weight:600;color:#1d1d1f;">${location}</td>
             </tr>
           </table>
         </div>
       </div>
       <p style="margin:0;font-size:13px;color:#86868b;">This is an automated ops alert from the KINDLY platform.</p>`,
    );

    await Promise.all(
      ADMINS.map((to) => this.send(to, `[KINDLY OPS] Event Cancelled — ${eventTitle}`, html)),
    );
  }

  async sendImpactLogged(
    to: string,
    name: string,
    eventTitle: string,
    hours: number,
  ): Promise<void> {
    await this.send(
      to,
      `Great job! Your hours for ${eventTitle} have been verified`,
      this.impactLoggedHtml(name, eventTitle, hours),
    );
  }

  async sendOrgApprovedEmail(to: string, name: string): Promise<void> {
    await this.send(
      to,
      "You're approved — welcome to KINDLY",
      this.orgApprovedHtml(name),
    );
  }

  // ─── HTML templates ───────────────────────────────────────────────────────

  private base(title: string, body: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo / wordmark -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-size:22px;font-weight:700;letter-spacing:-0.5px;color:#1d1d1f;">KINDLY</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;padding:40px 40px 32px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#86868b;line-height:1.6;">
                You received this because you have an account on KINDLY.<br/>
                © 2026 KINDLY. Nashik, India.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private volunteerWelcomeHtml(name: string): string {
    return this.base(
      'Welcome to KINDLY',
      `<h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#1d1d1f;letter-spacing:-0.5px;">Welcome, ${name}.</h1>
       <p style="margin:0 0 24px;font-size:16px;color:#86868b;line-height:1.6;">
         Your KINDLY account is ready. Start discovering volunteer events near you and build your impact resume.
       </p>
       <div style="background:#fef5f5;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
         <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#80242a;text-transform:uppercase;letter-spacing:0.5px;">What you can do</p>
         <ul style="margin:0;padding-left:20px;font-size:14px;color:#1d1d1f;line-height:1.8;">
           <li>Browse and RSVP to local volunteering events</li>
           <li>Build a verified digital impact resume</li>
           <li>Connect with other volunteers and organisations</li>
           <li>Track your hours and earn certificates</li>
         </ul>
       </div>
       <a href="${process.env.FRONTEND_URL || 'https://www.kindly.co.in'}/events"
          style="display:inline-block;background:#80242a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 28px;border-radius:100px;">
         Browse Events
       </a>`,
    );
  }

  private orgWelcomeHtml(name: string): string {
    return this.base(
      'Application Received — KINDLY',
      `<h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#1d1d1f;letter-spacing:-0.5px;">Application received.</h1>
       <p style="margin:0 0 24px;font-size:16px;color:#86868b;line-height:1.6;">
         Thanks, <strong style="color:#1d1d1f;">${name}</strong>. We've received your organisation's application and will review your documents within 24–48 hours.
       </p>
       <div style="background:#f5f5f7;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
         <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#1d1d1f;">What happens next</p>
         <ol style="margin:0;padding-left:20px;font-size:14px;color:#86868b;line-height:1.8;">
           <li>Our team verifies your registration documents</li>
           <li>You receive a confirmation email once approved</li>
           <li>Log in and start posting volunteer events</li>
         </ol>
       </div>
       <p style="margin:0;font-size:14px;color:#86868b;">
         Questions? Reply to this email or reach us at <a href="mailto:manasdhivare@gmail.com" style="color:#80242a;">manasdhivare@gmail.com</a>.
       </p>`,
    );
  }

  private orgApprovedHtml(name: string): string {
    return this.base(
      "You're approved — KINDLY",
      `<div style="display:inline-block;background:#f0fdf4;border-radius:100px;padding:6px 16px;margin-bottom:20px;">
         <span style="font-size:13px;font-weight:600;color:#16a34a;">✓ Application approved</span>
       </div>
       <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#1d1d1f;letter-spacing:-0.5px;">You're in, ${name}.</h1>
       <p style="margin:0 0 24px;font-size:16px;color:#86868b;line-height:1.6;">
         Your organisation has been approved. No password to set, no email link to click — just head back to KINDLY, enter the same email you applied with, and we'll send you a one-time code to sign in.
       </p>
       <a href="${process.env.FRONTEND_URL || 'https://www.kindly.co.in'}/"
          style="display:inline-block;background:#80242a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 28px;border-radius:100px;">
         Log in to KINDLY
       </a>`,
    );
  }

  private rsvpHtml(
    name: string,
    eventTitle: string,
    eventDate: string,
    eventLocation: string,
  ): string {
    return this.base(
      `You're in — ${eventTitle}`,
      `<div style="display:inline-block;background:#f0fdf4;border-radius:100px;padding:6px 16px;margin-bottom:20px;">
         <span style="font-size:13px;font-weight:600;color:#16a34a;">✓ Registration confirmed</span>
       </div>
       <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1d1d1f;letter-spacing:-0.5px;">You're in, ${name}!</h1>
       <p style="margin:0 0 24px;font-size:15px;color:#86868b;line-height:1.6;">
         Your spot is reserved. See you there!
       </p>
       <div style="border:1px solid #e8e8ed;border-radius:12px;overflow:hidden;margin-bottom:28px;">
         <div style="background:#80242a;padding:16px 20px;">
           <p style="margin:0;font-size:16px;font-weight:700;color:#ffffff;line-height:1.4;">${eventTitle}</p>
         </div>
         <div style="padding:16px 20px;background:#ffffff;">
           <table cellpadding="0" cellspacing="0">
             <tr>
               <td style="padding:4px 0;font-size:13px;color:#86868b;padding-right:16px;white-space:nowrap;">Date</td>
               <td style="padding:4px 0;font-size:13px;font-weight:600;color:#1d1d1f;">${eventDate}</td>
             </tr>
             <tr>
               <td style="padding:4px 0;font-size:13px;color:#86868b;padding-right:16px;white-space:nowrap;">Location</td>
               <td style="padding:4px 0;font-size:13px;font-weight:600;color:#1d1d1f;">${eventLocation}</td>
             </tr>
           </table>
         </div>
       </div>
       <a href="${process.env.FRONTEND_URL || 'https://www.kindly.co.in'}/history"
          style="display:inline-block;background:#1d1d1f;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:100px;">
         View My Events
       </a>`,
    );
  }

  private eventCancelledHtml(
    name: string,
    eventTitle: string,
    eventDate: string,
    eventLocation: string,
  ): string {
    return this.base(
      `${eventTitle} — Cancelled`,
      `<div style="display:inline-block;background:#fff1f2;border-radius:100px;padding:6px 16px;margin-bottom:20px;">
         <span style="font-size:13px;font-weight:600;color:#e11d48;">⚠ Event cancelled</span>
       </div>
       <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1d1d1f;letter-spacing:-0.5px;">We're sorry, ${name}.</h1>
       <p style="margin:0 0 24px;font-size:15px;color:#86868b;line-height:1.6;">
         The event you were registered for has been cancelled by the organiser. No action is needed on your part — your spot has been released.
       </p>
       <div style="border:1px solid #fecdd3;border-radius:12px;overflow:hidden;margin-bottom:28px;">
         <div style="background:#e11d48;padding:16px 20px;">
           <p style="margin:0;font-size:16px;font-weight:700;color:#ffffff;line-height:1.4;">${eventTitle}</p>
         </div>
         <div style="padding:16px 20px;background:#fff1f2;">
           <table cellpadding="0" cellspacing="0">
             <tr>
               <td style="padding:4px 0;font-size:13px;color:#86868b;padding-right:16px;white-space:nowrap;">Was scheduled</td>
               <td style="padding:4px 0;font-size:13px;font-weight:600;color:#1d1d1f;">${eventDate}</td>
             </tr>
             <tr>
               <td style="padding:4px 0;font-size:13px;color:#86868b;padding-right:16px;white-space:nowrap;">Location</td>
               <td style="padding:4px 0;font-size:13px;font-weight:600;color:#1d1d1f;">${eventLocation}</td>
             </tr>
           </table>
         </div>
       </div>
       <p style="margin:0 0 20px;font-size:14px;color:#86868b;line-height:1.6;">
         There are plenty of other ways to make an impact. Browse open events and find your next opportunity.
       </p>
       <a href="${process.env.FRONTEND_URL || 'https://www.kindly.co.in'}/events"
          style="display:inline-block;background:#80242a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:100px;">
         Find Another Event
       </a>`,
    );
  }

  private eventReminderHtml(
    name: string,
    eventTitle: string,
    eventDate: string,
    eventLocation: string,
  ): string {
    return this.base(
      `Reminder — ${eventTitle} is tomorrow`,
      `<div style="display:inline-block;background:#fef3c7;border-radius:100px;padding:6px 16px;margin-bottom:20px;">
         <span style="font-size:13px;font-weight:600;color:#d97706;">⏰ Tomorrow</span>
       </div>
       <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1d1d1f;letter-spacing:-0.5px;">See you tomorrow, ${name}!</h1>
       <p style="margin:0 0 24px;font-size:15px;color:#86868b;line-height:1.6;">
         This is a friendly reminder that you're volunteering tomorrow. Make sure you're ready!
       </p>
       <div style="border:1px solid #e8e8ed;border-radius:12px;overflow:hidden;margin-bottom:28px;">
         <div style="background:#d97706;padding:16px 20px;">
           <p style="margin:0;font-size:16px;font-weight:700;color:#ffffff;line-height:1.4;">${eventTitle}</p>
         </div>
         <div style="padding:16px 20px;background:#ffffff;">
           <table cellpadding="0" cellspacing="0">
             <tr>
               <td style="padding:4px 0;font-size:13px;color:#86868b;padding-right:16px;white-space:nowrap;">Date</td>
               <td style="padding:4px 0;font-size:13px;font-weight:600;color:#1d1d1f;">${eventDate}</td>
             </tr>
             <tr>
               <td style="padding:4px 0;font-size:13px;color:#86868b;padding-right:16px;white-space:nowrap;">Location</td>
               <td style="padding:4px 0;font-size:13px;font-weight:600;color:#1d1d1f;">${eventLocation}</td>
             </tr>
           </table>
         </div>
       </div>
       <div style="background:#f5f5f7;border-radius:12px;padding:16px 20px;margin-bottom:28px;">
         <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#1d1d1f;">Quick checklist</p>
         <ul style="margin:0;padding-left:20px;font-size:13px;color:#86868b;line-height:1.8;">
           <li>Check the event details and dress code</li>
           <li>Arrive a few minutes early to check in</li>
           <li>Bring anything listed under "Things to bring"</li>
         </ul>
       </div>
       <a href="${process.env.FRONTEND_URL || 'https://www.kindly.co.in'}/history"
          style="display:inline-block;background:#1d1d1f;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:100px;">
         View Event Details
       </a>`,
    );
  }

  private impactLoggedHtml(name: string, eventTitle: string, hours: number): string {
    return this.base(
      `Impact logged — ${eventTitle}`,
      `<div style="display:inline-block;background:#f0fdf4;border-radius:100px;padding:6px 16px;margin-bottom:20px;">
         <span style="font-size:13px;font-weight:600;color:#16a34a;">✓ Hours verified</span>
       </div>
       <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1d1d1f;letter-spacing:-0.5px;">Great work, ${name}!</h1>
       <p style="margin:0 0 24px;font-size:15px;color:#86868b;line-height:1.6;">
         Your attendance has been confirmed and your hours are now part of your official KINDLY impact record.
       </p>
       <div style="border:1px solid #bbf7d0;border-radius:12px;overflow:hidden;margin-bottom:28px;">
         <div style="background:#16a34a;padding:16px 20px;">
           <p style="margin:0;font-size:16px;font-weight:700;color:#ffffff;line-height:1.4;">${eventTitle}</p>
         </div>
         <div style="padding:20px;background:#f0fdf4;text-align:center;">
           <p style="margin:0 0 4px;font-size:40px;font-weight:700;color:#16a34a;line-height:1;">${hours}</p>
           <p style="margin:0;font-size:13px;color:#86868b;">hours contributed</p>
         </div>
       </div>
       <p style="margin:0 0 24px;font-size:14px;color:#86868b;line-height:1.6;">
         These hours are now visible on your profile. Keep building your impact resume — every session counts.
       </p>
       <a href="${process.env.FRONTEND_URL || 'https://www.kindly.co.in'}/volunteer-impact"
          style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:100px;">
         View My Impact
       </a>`,
    );
  }
}
