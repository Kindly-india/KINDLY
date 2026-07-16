import { Controller, Post, Body, ValidationPipe, BadRequestException, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { OrganizationSignupDto } from './dto/organization-signup.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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

  @Post('update-password')
  async updatePassword(@Body(ValidationPipe) dto: UpdatePasswordDto) {
    return this.authService.updatePassword(dto.password, dto.hash);
  }
}