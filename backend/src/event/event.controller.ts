import {
  Controller,
  Post,
  Get,
  Body,
  Delete,
  ValidationPipe,
  Request,
  UseGuards,
  Param,
  Patch,
  BadRequestException,
  Query,
  Header,
} from '@nestjs/common';
import { EventService } from './event.service';
import { CertificateService } from '../certificate/certificate.service';
import { CreateEventDto } from './dto/create-event.dto';
import { AdminCreateEventDto } from './dto/admin-create-event.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { BroadcastMessageDto } from './dto/broadcast-message.dto';
import { SelfCheckInDto } from './dto/self-check-in.dto';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';

@Controller('events')
export class EventController {
  constructor(
    private eventService: EventService,
    private certificateService: CertificateService,
  ) {}

  // Event auto-completion runs inside Postgres now (pg_cron) — see
  // backend/migrations/auto_complete_events_cron.sql. The old
  // POST /events/auto-complete route was removed with the external cron.

  // ==========================================
  // ADMIN "GHOST MODE" ROUTES
  // ==========================================

  // 1. Fetch all pending events
  @Get('admin/pending')
  @UseGuards(AdminGuard)
  async getPendingEvents() {
    return this.eventService.getPendingEvents();
  }

  // 2. Approve and update an event simultaneously
  @Patch('admin/approve/:id')
  @UseGuards(AdminGuard)
  async adminApproveEvent(
    @Param('id') eventId: string,
    @Body() updateData: any, // Using 'any' or 'Partial<CreateEventDto>' here since you're the admin overriding it
    @Request() req: any,
  ) {
    return this.eventService.adminApproveEvent(
      eventId,
      updateData,
      req.user.id,
      req.user.email ?? null,
    );
  }

  // 3. Admin creates an event directly on behalf of an org (auto-published)
  @Post('admin')
  @UseGuards(AdminGuard)
  async adminCreateEvent(
    @Request() req: any,
    @Body(ValidationPipe) dto: AdminCreateEventDto,
  ) {
    return this.eventService.adminCreateEvent(
      dto,
      req.user.id,
      req.user.email ?? null,
    );
  }

  // 4. Admin fetch/edit/roster for any event, regardless of status or org
  @Get('admin/:id')
  @UseGuards(AdminGuard)
  async adminGetEvent(@Param('id') id: string) {
    return this.eventService.adminGetEvent(id);
  }

  @Patch('admin/:id')
  @UseGuards(AdminGuard)
  async adminUpdateEvent(
    @Request() req: any,
    @Param('id') id: string,
    @Body(ValidationPipe) dto: CreateEventDto,
  ) {
    return this.eventService.adminUpdateEvent(
      id,
      dto,
      req.user.id,
      req.user.email ?? null,
    );
  }

  @Get('admin/:id/registrations')
  @UseGuards(AdminGuard)
  async adminGetEventRegistrations(@Param('id') id: string) {
    return this.eventService.adminGetEventRegistrations(id);
  }

  @Patch('admin/:id/registrations/:registrationId/check-in')
  @UseGuards(AdminGuard)
  async adminCheckInVolunteer(
    @Request() req: any,
    @Param('id') eventId: string,
    @Param('registrationId') registrationId: string,
  ) {
    return this.eventService.adminCheckInVolunteer(
      eventId,
      registrationId,
      req.user.id,
      req.user.email ?? null,
    );
  }

  @Patch('admin/:id/registrations/:registrationId/undo-check-in')
  @UseGuards(AdminGuard)
  async adminUndoCheckIn(
    @Request() req: any,
    @Param('id') eventId: string,
    @Param('registrationId') registrationId: string,
  ) {
    return this.eventService.adminUndoCheckIn(
      eventId,
      registrationId,
      req.user.id,
      req.user.email ?? null,
    );
  }

  // ==========================================
  // LOCATION SEARCH (event creation/editing — org only)
  // ==========================================

  // Global default (named 'short' in app.module.ts) is 20 req/60s, too tight
  // for search-as-you-type with a 300ms debounce — this overrides it to
  // something that fits actual typing cadence instead of the generic API cap.
  @Get('location-autocomplete')
  @Throttle({ short: { limit: 60, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard)
  async locationAutocomplete(
    @Query('q') query: string,
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    if (!query) throw new BadRequestException('Missing search query');
    const suggestions = await this.eventService.searchLocations(
      query,
      parseFloat(lat),
      parseFloat(lng),
    );
    return { suggestions };
  }

  @Get('location-reverse-geocode')
  @UseGuards(JwtAuthGuard)
  async locationReverseGeocode(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    if (!lat || !lng) throw new BadRequestException('Missing coordinates');
    return this.eventService.reverseGeocodeLocation(
      parseFloat(lat),
      parseFloat(lng),
    );
  }

  // ==========================================
  // 🟢 PUBLIC ROUTES (No Token Needed)
  // ==========================================

  @Get('public')
  @UseGuards(OptionalAuthGuard)
  async getPublicEvents(
    @Request() req: any,
    @Query('location') location?: string,
  ) {
    return this.eventService.getPublicEvents(req.user?.id, location);
  }

  @Get('top')
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
  async getTopEvents() {
    return this.eventService.getTopEvents();
  }

  @Get('completed')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  async getCompletedEvents() {
    return this.eventService.getCompletedEvents();
  }

  // This matches the error URL you saw: /events/:id/public
  @Get('details/:id')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  async getPublicEventById(@Param('id') id: string) {
    return this.eventService.getPublicEventById(id);
  }

  @Get(':id/broadcasts')
  async getBroadcasts(@Param('id') id: string) {
    return this.eventService.getEventBroadcasts(id);
  }

  // ==========================================
  // 🔒 PROTECTED ROUTES (Token Required)
  // ==========================================

  // 1. Volunteer Routes
  @Get('my-registrations')
  @UseGuards(JwtAuthGuard)
  async getMyRegistrations(@Request() req: any) {
    // This fetches the volunteer's history and active events
    return this.eventService.getVolunteerRegistrations(req.user.id);
  }

  // ✅ NEW: Send Broadcast (Protected for Org)
  @Post(':id/broadcast')
  @UseGuards(JwtAuthGuard)
  async sendBroadcast(
    @Request() req: any,
    @Param('id') id: string,
    @Body(ValidationPipe) dto: BroadcastMessageDto,
  ) {
    return this.eventService.sendBroadcast(req.user.id, id, dto.message);
  }

  // ✅ NEW: Recent Activity Route
  @Get('recent-activity')
  @UseGuards(JwtAuthGuard)
  async getRecentActivity(@Request() req: any) {
    return this.eventService.getRecentActivity(req.user.id);
  }

  // ✅ NEW: Upload Org Signature
  @Post('org/signature')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadSignature(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.eventService.uploadOrgSignature(req.user.id, file);
  }

  // Issue certificates for an event (org owner or admin)
  // Body is optional: { volunteerUserIds?: string[] }
  // When volunteerUserIds is present, only those volunteers receive a certificate.
  // When absent, all checked-in volunteers receive one.
  @Post(':id/certificates/issue')
  @UseGuards(JwtAuthGuard)
  async issueCertificates(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body?: { volunteerUserIds?: string[] },
  ) {
    return this.certificateService.issueForEvent(
      req.user.id,
      id,
      body?.volunteerUserIds?.length ? body.volunteerUserIds : undefined,
    );
  }

  // List all certificates for an event (org owner or admin)
  @Get(':id/certificates')
  @UseGuards(JwtAuthGuard)
  async getEventCertificates(@Request() req: any, @Param('id') id: string) {
    return this.certificateService.getCertificatesForEvent(req.user.id, id);
  }

  // This is the duplicate path some parts of your app might still use
  @Get('volunteer/my-registrations')
  @UseGuards(JwtAuthGuard)
  async getVolunteerRegistrationsAlt(@Request() req: any) {
    return this.eventService.getVolunteerRegistrations(req.user.id);
  }

  @Post(':id/register')
  @UseGuards(JwtAuthGuard)
  async registerForEvent(@Request() req: any, @Param('id') id: string) {
    return this.eventService.registerForEvent(req.user.id, id);
  }

  @Post('self-check-in')
  @UseGuards(JwtAuthGuard)
  async selfCheckIn(
    @Request() req: any,
    @Body(ValidationPipe) dto: SelfCheckInDto,
  ) {
    return this.eventService.selfCheckIn(req.user.id, dto);
  }

  // 2. Organization Routes
  @Get('my-events')
  @UseGuards(JwtAuthGuard)
  async getMyEvents(@Request() req: any) {
    return this.eventService.getOrganizationEvents(req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createEvent(
    @Request() req: any,
    @Body(ValidationPipe) dto: CreateEventDto,
  ) {
    return this.eventService.createEvent(req.user.id, dto);
  }

  @Delete(':id/broadcast/:broadcastId')
  @UseGuards(JwtAuthGuard)
  async deleteBroadcast(
    @Request() req: any,
    @Param('id') eventId: string,
    @Param('broadcastId') broadcastId: string,
  ) {
    return this.eventService.deleteBroadcast(req.user.id, eventId, broadcastId);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelEvent(@Request() req: any, @Param('id') id: string) {
    return this.eventService.cancelEvent(req.user.id, id);
  }

  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard)
  async completeEvent(@Request() req: any, @Param('id') id: string) {
    return this.eventService.completeEvent(req.user.id, id);
  }

  @Patch(':id/registrations/:registrationId/check-in')
  @UseGuards(JwtAuthGuard)
  async checkInVolunteer(
    @Request() req: any,
    @Param('id') eventId: string,
    @Param('registrationId') registrationId: string,
  ) {
    return this.eventService.checkInVolunteer(
      req.user.id,
      eventId,
      registrationId,
    );
  }

  @Patch(':id/registrations/:registrationId/undo-check-in')
  @UseGuards(JwtAuthGuard)
  async undoCheckIn(
    @Request() req: any,
    @Param('id') eventId: string,
    @Param('registrationId') registrationId: string,
  ) {
    return this.eventService.undoCheckIn(req.user.id, eventId, registrationId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateEvent(
    @Request() req: any,
    @Param('id') id: string,
    @Body(ValidationPipe) dto: CreateEventDto,
  ) {
    return this.eventService.updateEvent(req.user.id, id, dto);
  }

  // Volunteer cancels their own RSVP
  @Delete(':id/rsvp')
  @UseGuards(JwtAuthGuard)
  async cancelRsvp(@Request() req: any, @Param('id') id: string) {
    return this.eventService.cancelRsvp(req.user.id, id);
  }

  @Patch(':id/gallery')
  @UseGuards(JwtAuthGuard)
  async updateEventGallery(
    @Request() req: any,
    @Param('id') id: string,
    @Body(ValidationPipe) body: UpdateGalleryDto,
  ) {
    return this.eventService.updateEventGallery(
      req.user.id,
      id,
      body.galleryImages,
    );
  }

  @Get(':id/showcase')
  @UseGuards(JwtAuthGuard)
  async getShowcaseData(@Request() req: any, @Param('id') id: string) {
    return this.eventService.getShowcaseData(req.user.id, id);
  }

  // 3. Dynamic Routes (MUST BE LAST)
  // This handles /events/:id calls for Org Dashboard
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getEventById(@Request() req: any, @Param('id') id: string) {
    return this.eventService.getEventById(id, req.user.id);
  }

  @Get(':id/registrations')
  @UseGuards(JwtAuthGuard)
  async getEventRegistrations(@Request() req: any, @Param('id') id: string) {
    return this.eventService.getEventRegistrations(req.user.id, id);
  }

  // In EventController class

  @Post(':id/review')
  @UseGuards(JwtAuthGuard)
  async submitReview(
    @Request() req: any,
    @Param('id') eventId: string,
    @Body(ValidationPipe) dto: SubmitReviewDto,
  ) {
    return this.eventService.submitReview(
      req.user.id,
      eventId,
      dto.rating,
      dto.comment,
    );
  }

  // Add this route
  @Get(':id/review/me')
  @UseGuards(JwtAuthGuard)
  async getMyReview(@Request() req: any, @Param('id') eventId: string) {
    return this.eventService.getVolunteerReview(req.user.id, eventId);
  }
}
