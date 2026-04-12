import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { VolunteerSignupDto } from './dto/volunteer-signup.dto';
import { OrganizationSignupDto } from './dto/organization-signup.dto';
import { Throttle } from '@nestjs/throttler';

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
}