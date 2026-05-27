import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { UpdateOrganizationProfileDto } from './dto/update-organization-profile.dto';
import { AddReviewDto } from './dto/add-review.dto';

@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) { }

  // Uses OptionalAuthGuard (Supabase-validated) so req.user is always correct
  // for Supabase tokens — consistent with the volunteer profile endpoint.
  @UseGuards(OptionalAuthGuard)
  @Get(':id/profile')
  async getPublicProfile(@Param('id') id: string, @Request() req: any) {
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

  // ─── Action Gallery ────────────────────────────────────────────────────────

  // GET /organizations/:id/gallery — public
  @Get(':id/gallery')
  async getOrgGallery(@Param('id') id: string) {
    return this.organizationService.getOrgGallery(id);
  }

  // POST /organizations/gallery — org owner only
  @UseGuards(JwtAuthGuard)
  @Post('gallery')
  @UseInterceptors(FileInterceptor('file'))
  async uploadOrgGalleryPhoto(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.organizationService.addToOrgGallery(req.user.id, file);
  }

  // DELETE /organizations/gallery/:photoId — org owner only
  @UseGuards(JwtAuthGuard)
  @Delete('gallery/:photoId')
  async deleteOrgGalleryPhoto(
    @Request() req: any,
    @Param('photoId') photoId: string,
  ) {
    return this.organizationService.deleteFromOrgGallery(req.user.id, photoId);
  }
}