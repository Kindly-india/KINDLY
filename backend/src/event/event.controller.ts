import { Controller, Post, Get, Body, Delete, ValidationPipe, Request, UseGuards, Param, Patch, BadRequestException } from '@nestjs/common';
import { EventService } from './event.service';
import { CertificateService } from '../certificate/certificate.service';
import { CreateEventDto } from './dto/create-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('events')
export class EventController {
  constructor(
    private eventService: EventService,
    private certificateService: CertificateService,
  ) { }

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
    @Body() updateData: any // Using 'any' or 'Partial<CreateEventDto>' here since you're the admin overriding it
  ) {
    return this.eventService.adminApproveEvent(eventId, updateData);
  }

  // ==========================================
  // 🟢 PUBLIC ROUTES (No Token Needed)
  // ==========================================

  @Get('public')
  @UseGuards(OptionalAuthGuard)
  async getPublicEvents(@Request() req: any) {
    return this.eventService.getPublicEvents(req.user?.id);
  }

  @Get('top')
  async getTopEvents() {
    return this.eventService.getTopEvents();
  }

  // This matches the error URL you saw: /events/:id/public
  @Get('details/:id')
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
  async sendBroadcast(@Request() req: any, @Param('id') id: string, @Body() body: { message: string }) {
    return this.eventService.sendBroadcast(req.user.id, id, body.message);
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
  async uploadSignature(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
    return this.eventService.uploadOrgSignature(req.user.id, file);
  }

  // Issue certificates for an event (org owner or admin)
  @Post(':id/certificates/issue')
  @UseGuards(JwtAuthGuard)
  async issueCertificates(@Request() req: any, @Param('id') id: string) {
    return this.certificateService.issueForEvent(req.user.id, id);
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
  async selfCheckIn(@Request() req: any, @Body() body: { eventId: string; code: string; latitude: number; longitude: number }) {
    return this.eventService.selfCheckIn(req.user.id, body);
  }

  // 2. Organization Routes
  @Get('my-events')
  @UseGuards(JwtAuthGuard)
  async getMyEvents(@Request() req: any) {
    return this.eventService.getOrganizationEvents(req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createEvent(@Request() req: any, @Body(ValidationPipe) dto: CreateEventDto) {
    return this.eventService.createEvent(req.user.id, dto);
  }

  @Delete(':id/broadcast/:broadcastId')
  @UseGuards(JwtAuthGuard)
  async deleteBroadcast(
    @Request() req: any,
    @Param('id') eventId: string,
    @Param('broadcastId') broadcastId: string
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
    return this.eventService.checkInVolunteer(req.user.id, eventId, registrationId);
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
    @Body(ValidationPipe) dto: CreateEventDto
  ) {
    return this.eventService.updateEvent(req.user.id, id, dto);
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
    @Body() body: { rating: number; comment: string }
  ) {
    if (!body.rating || body.rating < 1 || body.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }
    return this.eventService.submitReview(req.user.id, eventId, body.rating, body.comment);
  }

  // Add this route
  @Get(':id/review/me')
  @UseGuards(JwtAuthGuard)
  async getMyReview(@Request() req: any, @Param('id') eventId: string) {
    return this.eventService.getVolunteerReview(req.user.id, eventId);
  }

}