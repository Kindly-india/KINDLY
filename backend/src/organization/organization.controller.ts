import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/dto/optional-jwt-auth.guard'; // ✅ Use the custom guard you created
import { UpdateOrganizationProfileDto } from './dto/update-organization-profile.dto';
import { AddReviewDto } from './dto/add-review.dto';

@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) { }

  // ✅ UPDATED: Public profile with Security Check
  // Uses OptionalJwtAuthGuard to allow both Guests and Logged-in users
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/profile')
  async getPublicProfile(@Param('id') id: string, @Request() req: any) {
    // req.user might be null if guest, or contain {id: ...} if logged in
    return this.organizationService.getPublicProfile(id, req.user?.id);
  }

  // Public events
  @Get(':id/events')
  async getOrgEvents(@Param('id') id: string) {
    return this.organizationService.getOrgEvents(id);
  }

  // Public reviews
  @Get(':id/reviews')
  async getReviews(@Param('id') id: string) {
    return this.organizationService.getOrgReviews(id);
  }

  // Volunteers (org owner only)
  @UseGuards(JwtAuthGuard)
  @Get(':id/volunteers')
  async getOrgVolunteers(@Param('id') id: string, @Request() req: any) {
    return this.organizationService.getOrgVolunteers(id, req.user.id);
  }

  // Update own profile
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Request() req: any,
    @Body() dto: UpdateOrganizationProfileDto
  ) {
    return this.organizationService.updateProfile(req.user.id, dto);
  }

  // Toggle follow
  @UseGuards(JwtAuthGuard)
  @Post(':id/follow')
  async toggleFollow(@Param('id') id: string, @Request() req: any) {
    return this.organizationService.toggleFollow(id, req.user.id);
  }

  // Check follow status
  @UseGuards(JwtAuthGuard)
  @Get(':id/follow-status')
  async checkFollowStatus(@Param('id') id: string, @Request() req: any) {
    return this.organizationService.checkFollowStatus(id, req.user.id);
  }

  // Add review (volunteers only)
  @UseGuards(JwtAuthGuard)
  @Post('reviews')
  async addReview(@Request() req: any, @Body() dto: AddReviewDto) {
    return this.organizationService.addReview(req.user.id, dto);
  }
}