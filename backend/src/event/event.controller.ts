import { Controller, Post, Get, Body, ValidationPipe, Request, UseGuards, Param } from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('events')
export class EventController {
  constructor(private eventService: EventService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createEvent(@Request() req: any, @Body(ValidationPipe) dto: CreateEventDto) {
    const userId = req.user.id;
    return this.eventService.createEvent(userId, dto);
  }

  @Get('my-events')
  @UseGuards(JwtAuthGuard)
  async getMyEvents(@Request() req: any) {
    const userId = req.user.id;
    return this.eventService.getOrganizationEvents(userId);
  }

  @Get('public')
  async getPublicEvents() {
    return this.eventService.getPublicEvents();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getEventById(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id;
    return this.eventService.getEventById(id, userId);
  }
}