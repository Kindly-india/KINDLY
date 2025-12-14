import { Controller, Post, Get, Body, ValidationPipe, Request, UseGuards } from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';

@Controller('events')
export class EventController {
  constructor(private eventService: EventService) {}

  @Post()
  async createEvent(@Request() req: any, @Body(ValidationPipe) dto: CreateEventDto) {
    // Get user ID from Supabase auth header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new Error('Unauthorized');
    }

    // For now, we'll extract userId from token manually
    // You'll need to implement proper auth guard later
    const token = authHeader.replace('Bearer ', '');
    
    // TODO: Verify token and get user ID
    // For now, accept userId from body for testing
    const userId = req.body.userId || req.user?.id;
    
    return this.eventService.createEvent(userId, dto);
  }

  @Get('my-events')
  async getMyEvents(@Request() req: any) {
    const userId = req.body.userId || req.user?.id;
    return this.eventService.getOrganizationEvents(userId);
  }

  @Get('public')
  async getPublicEvents() {
    return this.eventService.getPublicEvents();
  }
}