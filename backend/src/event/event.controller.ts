import { Controller, Post, Get, Body, ValidationPipe, Request, UseGuards, Param, Patch } from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('events')
export class EventController {
  constructor(private eventService: EventService) {}


  @Get('public') // Specific path 'public'
  async getPublicEvents() {
    return this.eventService.getPublicEvents();
  }

  // --- 2. PROTECTED STATIC ROUTES SECOND ---

  @Get('my-events') // Specific path 'my-events'
  @UseGuards(JwtAuthGuard)
  async getMyEvents(@Request() req: any) {
    const userId = req.user.id;
    return this.eventService.getOrganizationEvents(userId);
  }

  @Get('volunteer/my-registrations') // Specific path
  @UseGuards(JwtAuthGuard)
  async getVolunteerRegistrations(@Request() req: any) {
    const userId = req.user.id;
    return this.eventService.getVolunteerRegistrations(userId);
  }

  // --- 3. DYNAMIC ROUTES LAST ( :id ) ---
  // These act as "catch-all" for anything not matched above

  @Post()
  @UseGuards(JwtAuthGuard)
  async createEvent(@Request() req: any, @Body(ValidationPipe) dto: CreateEventDto) {
    const userId = req.user.id;
    return this.eventService.createEvent(userId, dto);
  }

  @Get(':id/public')
  async getPublicEventById(@Param('id') id: string) {
    return this.eventService.getPublicEventById(id);
  }

   @Get('top')
  async getTopEvents() {
    return this.eventService.getTopEvents();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getEventById(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id;
    return this.eventService.getEventById(id, userId);
  }

  @Post(':id/register')
  @UseGuards(JwtAuthGuard)
  async registerForEvent(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id;
    return this.eventService.registerForEvent(userId, id);
  }

  @Get(':id/registrations')
  @UseGuards(JwtAuthGuard)
  async getEventRegistrations(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id;
    return this.eventService.getEventRegistrations(userId, id);
  }

  @Patch(':id/registrations/:registrationId/check-in')
  @UseGuards(JwtAuthGuard)
  async checkInVolunteer(
    @Request() req: any,
    @Param('id') eventId: string,
    @Param('registrationId') registrationId: string,
  ) {
    const userId = req.user.id;
    return this.eventService.checkInVolunteer(userId, eventId, registrationId);
  }

  @Patch(':id/registrations/:registrationId/undo-check-in')
  @UseGuards(JwtAuthGuard)
  async undoCheckIn(
    @Request() req: any,
    @Param('id') eventId: string,
    @Param('registrationId') registrationId: string,
  ) {
    const userId = req.user.id;
    return this.eventService.undoCheckIn(userId, eventId, registrationId);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelEvent(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id;
    return this.eventService.cancelEvent(userId, id);
  }

  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard)
  async completeEvent(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id;
    return this.eventService.completeEvent(userId, id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateEvent(
    @Request() req: any,
    @Param('id') id: string,
    @Body(ValidationPipe) dto: CreateEventDto
  ) {
    const userId = req.user.id;
    return this.eventService.updateEvent(userId, id, dto);
  }
}