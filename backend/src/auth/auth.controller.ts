import { Controller, Post, Body, ValidationPipe, BadRequestException, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { VolunteerSignupDto } from './dto/volunteer-signup.dto';
import { OrganizationSignupDto } from './dto/organization-signup.dto';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('signup/volunteer')
  async signupVolunteer(@Body(ValidationPipe) dto: VolunteerSignupDto) {
    return this.authService.signupVolunteer(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('signup/organization')
  async signupOrganization(@Body(ValidationPipe) dto: OrganizationSignupDto) {
    return this.authService.signupOrganization(dto);
  }

  @Post('welcome-email')
  @UseGuards(JwtAuthGuard)
  async sendWelcomeEmail(@Request() req: any) {
    await this.authService.dispatchWelcomeEmail(req.user.id);
    return { message: 'ok' };
  }

  @Post('reset-password')
  async resetPassword(@Body('email') email: string) {
    return this.authService.resetPassword(email);
  }

  @Post('update-password')
  async updatePassword(@Body() body: { password: string; hash: string }) {
    if (!body.password || !body.hash) {
      throw new BadRequestException('Password and secure token are required');
    }
    return this.authService.updatePassword(body.password, body.hash);
  }
}