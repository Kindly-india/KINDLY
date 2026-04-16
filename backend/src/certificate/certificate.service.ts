import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { renderCertificateHTML } from '../event/templates/certificate.template';
import { v4 as uuidv4 } from 'uuid';
import * as puppeteer from 'puppeteer';

function formatEventDate(dateStr: string): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const [year, month, day] = dateStr.split('-').map(Number);
  return `${day} ${months[month - 1]} ${year}`;
}

function calcHours(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  return Math.max(0, Math.round((diff / 60) * 10) / 10);
}

@Injectable()
export class CertificateService {
  constructor(private supabaseService: SupabaseService) {}

  // ─────────────────────────────────────────────
  // PRIVATE: Render HTML → PDF buffer via Puppeteer
  // ─────────────────────────────────────────────
  private async generatePdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
    try {
      const page = await browser.newPage();
      // 'load' fires once the page load event fires. networkidle0/2 both time out
      // because Google Fonts CDN keeps HTTP/2 connections alive indefinitely.
      // document.fonts.ready ensures all @font-face rules have finished loading.
      await page.setContent(html, { waitUntil: 'load', timeout: 30000 });
      await page.evaluateHandle('document.fonts.ready');
      const pdf = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  // ─────────────────────────────────────────────
  // 1. issueForEvent — combined org/admin auth check + generation
  // ─────────────────────────────────────────────
  async issueForEvent(userId: string, eventId: string) {
    const supabase = this.supabaseService.getClient();

    // Check if admin
    const { data: volProfile } = await supabase
      .from('volunteer_profiles')
      .select('is_admin')
      .eq('user_id', userId)
      .single();

    const isAdmin = volProfile?.is_admin === true;

    // Check if org owner of this event
    let isOrgOwner = false;
    if (!isAdmin) {
      const { data: orgProfile } = await supabase
        .from('organization_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (orgProfile) {
        const { data: ownerCheck } = await supabase
          .from('events')
          .select('id')
          .eq('id', eventId)
          .eq('organization_id', orgProfile.id)
          .single();
        isOrgOwner = !!ownerCheck;
      }
    }

    if (!isAdmin && !isOrgOwner) {
      throw new ForbiddenException(
        'Only the event organizer or an admin can issue certificates',
      );
    }

    // Verify event is completed
    const { data: event } = await supabase
      .from('events')
      .select('status')
      .eq('id', eventId)
      .single();

    if (!event) throw new NotFoundException('Event not found');
    if (event.status !== 'completed') {
      throw new BadRequestException(
        'Event must be marked as completed before issuing certificates',
      );
    }

    const result = await this.generateForEvent(eventId);

    // Keep the backward-compat flag updated
    await supabase
      .from('events')
      .update({ certificates_issued: true })
      .eq('id', eventId);

    return { message: 'Certificates issued successfully', ...result };
  }

  // ─────────────────────────────────────────────
  // 2. generateForEvent — core generation loop, idempotent
  // ─────────────────────────────────────────────
  async generateForEvent(
    eventId: string,
  ): Promise<{ issued: number; skipped: number; total: number }> {
    const supabase = this.supabaseService.getClient();

    // Fetch event with org profile
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*, organization_profiles(id, name, logo_url)')
      .eq('id', eventId)
      .single();

    if (eventError || !event) throw new NotFoundException('Event not found');

    const org = (event as any).organization_profiles;
    const hours = calcHours(event.start_time, event.end_time);
    const formattedEventDate = formatEventDate(event.event_date);
    const formattedIssuedDate = formatEventDate(
      new Date().toISOString().split('T')[0],
    );

    // Fetch eligible registrations
    const { data: registrations, error: regError } = await supabase
      .from('event_registrations')
      .select('id, volunteer_id, volunteer_profiles(id, full_name)')
      .eq('event_id', eventId)
      .in('status', ['checked_in', 'completed']);

    if (regError) throw new InternalServerErrorException(regError.message);
    if (!registrations?.length) {
      return { issued: 0, skipped: 0, total: 0 };
    }

    // Idempotency: find volunteers who already have a cert for this event
    const { data: existing } = await supabase
      .from('certificates')
      .select('volunteer_id')
      .eq('event_id', eventId);

    const alreadyIssued = new Set(
      (existing || []).map((c: any) => c.volunteer_id),
    );

    let issued = 0;
    let skipped = 0;

    for (const reg of registrations) {
      const vol = (reg as any).volunteer_profiles;
      if (!vol) continue;

      if (alreadyIssued.has(vol.id)) {
        skipped++;
        continue;
      }

      const verificationId = uuidv4();

      const html = renderCertificateHTML({
        volunteerName: vol.full_name || 'Volunteer',
        eventTitle: event.title,
        orgName: org?.name || 'KINDLY Partner',
        orgLogoUrl: org?.logo_url || null,
        eventDate: formattedEventDate,
        hoursContributed: hours,
        verificationId,
        issuedDate: formattedIssuedDate,
      });

      let pdfBuffer: Buffer;
      try {
        pdfBuffer = await this.generatePdf(html);
      } catch (err) {
        console.error(`PDF generation failed for volunteer ${vol.id}:`, err);
        throw new InternalServerErrorException(
          'PDF generation failed. Check Puppeteer installation.',
        );
      }

      const storagePath = `${eventId}/${vol.id}-${verificationId}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(storagePath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (uploadError) {
        throw new InternalServerErrorException(
          'Failed to upload certificate: ' + uploadError.message,
        );
      }

      const { error: insertError } = await supabase
        .from('certificates')
        .insert({
          verification_id: verificationId,
          event_id: eventId,
          volunteer_id: vol.id,
          registration_id: reg.id,
          storage_path: storagePath,
          hours_credited: hours,
        });

      if (insertError) {
        // Clean up the uploaded file on DB failure
        await supabase.storage
          .from('certificates')
          .remove([storagePath]);
        throw new InternalServerErrorException(insertError.message);
      }

      issued++;
    }

    return { issued, skipped, total: registrations.length };
  }

  // ─────────────────────────────────────────────
  // 3. getDownloadUrl — volunteer, admin, or event's org
  // ─────────────────────────────────────────────
  async getDownloadUrl(certificateId: string, requestingUserId: string): Promise<{ signedUrl: string }> {
    const supabase = this.supabaseService.getClient();

    const { data: cert, error } = await supabase
      .from('certificates')
      .select('id, volunteer_id, event_id, storage_path')
      .eq('id', certificateId)
      .single();

    if (error || !cert) throw new NotFoundException('Certificate not found');

    // Check ownership: volunteer who owns it
    const { data: volProfile } = await supabase
      .from('volunteer_profiles')
      .select('id, is_admin')
      .eq('user_id', requestingUserId)
      .single();

    const isOwner = volProfile?.id === cert.volunteer_id;
    const isAdmin = volProfile?.is_admin === true;

    // Check if org owner of the event
    let isOrgOwner = false;
    if (!isOwner && !isAdmin) {
      const { data: orgProfile } = await supabase
        .from('organization_profiles')
        .select('id')
        .eq('user_id', requestingUserId)
        .single();

      if (orgProfile) {
        const { data: eventRow } = await supabase
          .from('events')
          .select('organization_id')
          .eq('id', cert.event_id)
          .single();

        isOrgOwner = eventRow?.organization_id === orgProfile.id;
      }
    }

    if (!isOwner && !isAdmin && !isOrgOwner) {
      throw new ForbiddenException('You do not have access to this certificate');
    }

    // Generate signed URL valid for 1 hour
    const { data: urlData, error: urlError } = await supabase.storage
      .from('certificates')
      .createSignedUrl(cert.storage_path, 3600);

    if (urlError || !urlData?.signedUrl) {
      throw new InternalServerErrorException('Failed to generate download URL');
    }

    return { signedUrl: urlData.signedUrl };
  }

  // ─────────────────────────────────────────────
  // 4. getCertificatesForVolunteer — volunteer's own list
  // ─────────────────────────────────────────────
  async getCertificatesForVolunteer(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: volProfile } = await supabase
      .from('volunteer_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!volProfile) throw new NotFoundException('Volunteer profile not found');

    const { data: certificates, error } = await supabase
      .from('certificates')
      .select(`
        id,
        verification_id,
        issued_at,
        hours_credited,
        event_id,
        events (
          title,
          event_date,
          organization_profiles ( name )
        )
      `)
      .eq('volunteer_id', volProfile.id)
      .order('issued_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);

    return {
      certificates: (certificates || []).map((c: any) => ({
        id: c.id,
        verification_id: c.verification_id,
        issued_at: c.issued_at,
        hours_credited: c.hours_credited,
        event_id: c.event_id,
        event_title: c.events?.title,
        event_date: c.events?.event_date,
        org_name: c.events?.organization_profiles?.name,
      })),
    };
  }

  // ─────────────────────────────────────────────
  // 5. getCertificatesForEvent — org/admin view
  // ─────────────────────────────────────────────
  async getCertificatesForEvent(userId: string, eventId: string) {
    const supabase = this.supabaseService.getClient();

    // Allow org owner or admin
    const { data: volProfile } = await supabase
      .from('volunteer_profiles')
      .select('is_admin')
      .eq('user_id', userId)
      .single();

    const isAdmin = volProfile?.is_admin === true;

    if (!isAdmin) {
      const { data: orgProfile } = await supabase
        .from('organization_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!orgProfile) throw new ForbiddenException('Access denied');

      const { data: eventRow } = await supabase
        .from('events')
        .select('organization_id')
        .eq('id', eventId)
        .single();

      if (eventRow?.organization_id !== orgProfile.id) {
        throw new ForbiddenException('You do not own this event');
      }
    }

    const { data: certificates, error } = await supabase
      .from('certificates')
      .select(`
        id,
        verification_id,
        issued_at,
        hours_credited,
        volunteer_profiles ( id, full_name, avatar_url )
      `)
      .eq('event_id', eventId)
      .order('issued_at', { ascending: true });

    if (error) throw new InternalServerErrorException(error.message);

    return {
      certificates: (certificates || []).map((c: any) => ({
        id: c.id,
        verification_id: c.verification_id,
        issued_at: c.issued_at,
        hours_credited: c.hours_credited,
        volunteer_id: c.volunteer_profiles?.id,
        volunteer_name: c.volunteer_profiles?.full_name,
        volunteer_avatar: c.volunteer_profiles?.avatar_url,
      })),
    };
  }
}
