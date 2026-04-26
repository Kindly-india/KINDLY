import { Controller, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { PhoneVerificationService } from './phone-verification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('phone-verification')
@UseGuards(JwtAuthGuard)
export class PhoneVerificationController {
  constructor(private service: PhoneVerificationService) {}

  @Post('save')
  async save(@Request() req: any, @Body('phone') phone: string) {
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      throw new BadRequestException('Invalid phone number. Must be 10 digits starting with 6-9.');
    }
    await this.service.savePhone(req.user.id, phone);
    return { success: true };
  }
}
