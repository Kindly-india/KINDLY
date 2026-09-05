import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  BadRequestException,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { OrganizationSignupDto } from './dto/organization-signup.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UploadOrgDocumentDto } from './dto/upload-org-document.dto';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { MAX_FILE_SIZE_BYTES } from '../common/file-validation.util';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Unauthenticated by necessity — the org signup wizard uploads KYC
  // documents before the applicant's account exists (see AuthService.
  // uploadOrgDocument). Throttled the same as the signup endpoint itself
  // since it's reachable by anyone.
  @Throttle({ short: { limit: 10, ttl: 3_600_000 } })
  @Post('signup/organization/documents')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE_BYTES } }),
  )
  async uploadOrgDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body(ValidationPipe) dto: UploadOrgDocumentDto,
  ) {
    return this.authService.uploadOrgDocument(file, dto.orgType);
  }

  @Throttle({ short: { limit: 10, ttl: 3_600_000 } })
  @Post('signup/organization')
  async signupOrganization(@Body(ValidationPipe) dto: OrganizationSignupDto) {
    return this.authService.signupOrganization(dto);
  }

  // Pre-flight check the universal sign-in box calls before sending an OTP —
  // blocks login for organizations still awaiting approval. No per-route
  // override: it's called on every login and shared public IPs (colleges) would
  // trip an hourly cap, so it inherits the generous global per-IP limit.
  @Post('check-org-status')
  async checkOrgStatus(@Body('email') email: string) {
    return this.authService.checkOrgStatus(email);
  }

  @Post('welcome-email')
  @UseGuards(JwtAuthGuard)
  async sendWelcomeEmail(@Request() req: any) {
    await this.authService.dispatchWelcomeEmail(req.user.id);
    return { message: 'ok' };
  }

  @Throttle({ short: { limit: 5, ttl: 3_600_000 } })
  @Post('reset-password')
  async resetPassword(@Body('email') email: string) {
    return this.authService.resetPassword(email);
  }

  @Throttle({ short: { limit: 5, ttl: 3_600_000 } })
  @Post('update-password')
  async updatePassword(@Body(ValidationPipe) dto: UpdatePasswordDto) {
    return this.authService.updatePassword(dto.password, dto.hash);
  }
}
