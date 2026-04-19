import { Controller, Get, InternalServerErrorException } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // TEMP: remove after confirming Sentry is working
  @Get('sentry-test')
  sentryTest(): never {
    throw new InternalServerErrorException('Sentry test error — delete this route after confirming');
  }
}
