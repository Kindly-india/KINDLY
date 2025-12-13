import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { VolunteerSignupDto } from './dto/volunteer-signup.dto';
import { OrganizationSignupDto } from './dto/organization-signup.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup/volunteer')
  async signupVolunteer(@Body(ValidationPipe) dto: VolunteerSignupDto) {
    return this.authService.signupVolunteer(dto);
  }

  @Post('signup/organization')
  async signupOrganization(@Body(ValidationPipe) dto: OrganizationSignupDto) {
    return this.authService.signupOrganization(dto);
  }
}