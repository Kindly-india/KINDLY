import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Patch,
  Param,
  UseInterceptors, // ✅ Added for file upload
  UploadedFile,    // ✅ Added for file upload
  Delete           // ✅ Added for delete
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express'; // ✅ Helper for parsing files
import { VolunteerService } from './volunteer.service';
import { CertificateService } from '../certificate/certificate.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateVolunteerProfileDto } from './dto/update-volunteer-profile.dto';
import { OnboardingDto } from './dto/onboarding.dto';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';

@Controller('volunteers')
export class VolunteerController {
  constructor(
    private readonly volunteerService: VolunteerService,
    private readonly certificateService: CertificateService,
  ) { }

  // 1. Get Own Profile (Private)
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getOwnProfile(@Request() req: any) {
    return this.volunteerService.getProfileForViewer(req.user.id, req.user.id);
  }

  // 2. Update Own Profile
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Request() req: any,
    @Body() dto: UpdateVolunteerProfileDto
  ) {
    return this.volunteerService.updateProfile(req.user.id, dto);
  }

  // 3. Smart Profile View (Public / Resume / Private)
  @Get(':id/profile')
  @UseGuards(OptionalAuthGuard)
  async getProfileForViewer(@Param('id') targetId: string, @Request() req: any) {
    const viewerId = req.user?.id || null;
    return this.volunteerService.getProfileForViewer(targetId, viewerId);
  }

  // 4. Public Journey (History)
  @Get(':id/journey')
  async getJourney(@Param('id') id: string) {
    return this.volunteerService.getJourney(id);
  }

  // ============ ✅ NEW GALLERY ENDPOINTS ============

  // 5. Get Gallery (Public)
  @Get(':id/gallery')
  async getGallery(@Param('id') id: string) {
    // You might need to resolve Profile ID -> User ID inside the service if 'id' is a profile ID
    // For now, assuming the frontend passes the User ID (which it does in my code)
    return this.volunteerService.getGallery(id);
  }

  // 6. Upload Photo (Protected)
  @UseGuards(JwtAuthGuard)
  @Post('gallery')
  @UseInterceptors(FileInterceptor('file')) // 'file' matches the frontend formData key
  async uploadGalleryPhoto(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // req.user.id comes from the JWT
    return this.volunteerService.addToGallery(req.user.id, file);
  }

  // 7. Delete Photo (Protected)
  @UseGuards(JwtAuthGuard)
  @Delete('gallery/:photoId')
  async deleteGalleryPhoto(
    @Request() req: any,
    @Param('photoId') photoId: string
  ) {
    return this.volunteerService.deleteFromGallery(req.user.id, photoId);
  }

  // 8. My Certificates
  @UseGuards(JwtAuthGuard)
  @Get('me/certificates')
  async getMyCertificates(@Request() req: any) {
    return this.certificateService.getCertificatesForVolunteer(req.user.id);
  }

  // 9. Postable Events
  @UseGuards(JwtAuthGuard)
  @Get('me/postable-events')
  async getPostableEvents(@Request() req: any) {
    return this.volunteerService.getPostableEvents(req.user.id);
  }

  // 10. Complete Onboarding
  @UseGuards(JwtAuthGuard)
  @Patch('me/onboarding')
  async completeOnboarding(
    @Request() req: any,
    @Body() dto: OnboardingDto,
  ) {
    return this.volunteerService.updateOnboarding(req.user.id, dto);
  }
}