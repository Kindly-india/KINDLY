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
import { AdminGuard } from '../auth/guards/admin.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { UpdateOrganizationProfileDto } from './dto/update-organization-profile.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { AddReviewDto } from './dto/add-review.dto';
import { SetApprovalDto } from './dto/set-approval.dto';
import { SetSuspensionDto } from '../common/dto/set-suspension.dto';

@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  // ─── Admin approval (admin-only) ────────────────────────────────────────────
  // Registered before the ':id/...' routes so 'admin' isn't captured as an :id.

  @UseGuards(AdminGuard)
  @Get('admin/pending')
  async getPendingOrgs() {
    return this.organizationService.getPendingOrganizations();
  }

  // Approve/reject an org. On approval this emails the org + notifies inline —
  // replaces the old DB trigger -> webhook -> shared-secret flow entirely.
  @UseGuards(AdminGuard)
  @Patch('admin/:id/approval')
  async setOrgApproval(
    @Param('id') id: string,
    @Body() dto: SetApprovalDto,
    @Request() req: any,
  ) {
    return this.organizationService.setApprovalStatus(
      id,
      dto.status,
      req.user.id,
      req.user.email ?? null,
    );
  }

  // Admin detail view — always private/KYC fields, regardless of viewer.
  @UseGuards(AdminGuard)
  @Get('admin/:id')
  async adminGetOrganization(@Param('id') id: string) {
    return this.organizationService.adminGetOrganization(id);
  }

  // Permanent delete — restricted to superadmin (P2-20), not any admin.
  @UseGuards(AdminGuard, SuperAdminGuard)
  @Delete('admin/:id')
  async hardDeleteOrganization(
    @Param('id') id: string,
    @Body() dto: { confirmName: string },
    @Request() req: any,
  ) {
    return this.organizationService.hardDeleteOrganization(
      id,
      dto.confirmName,
      req.user.id,
      req.user.email ?? null,
    );
  }

  // Reversible suspend/reactivate for an already-approved org (P2-19) —
  // distinct from the approve/reject flow above.
  @UseGuards(AdminGuard)
  @Patch('admin/:id/suspension')
  async setOrgSuspension(
    @Param('id') id: string,
    @Body() dto: SetSuspensionDto,
    @Request() req: any,
  ) {
    return this.organizationService.setSuspension(
      id,
      dto.suspended,
      dto.reason,
      req.user.id,
      req.user.email ?? null,
    );
  }

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
    @Body() dto: UpdateOrganizationProfileDto,
  ) {
    return this.organizationService.updateProfile(req.user.id, dto);
  }

  // Dedicated endpoint for the login email — kept separate from the general
  // profile PATCH so it always goes through changeEmail's auth-first,
  // rollback-safe path instead of a plain table write.
  @UseGuards(JwtAuthGuard)
  @Patch('email')
  async changeEmail(@Request() req: any, @Body() dto: ChangeEmailDto) {
    return this.organizationService.changeEmail(req.user.id, dto.email);
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
