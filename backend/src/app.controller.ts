import { Controller, Get, InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';
import { AppService } from './app.service';
import { SupabaseService } from './supabase/supabase.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly supabase: SupabaseService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async healthCheck() {
    const start = Date.now();
    let dbOk = true;
    try {
      const { error } = await this.supabase.getClient()
        .from('volunteer_profiles')
        .select('id', { count: 'exact', head: true });
      if (error) dbOk = false;
    } catch {
      dbOk = false;
    }
    const payload = {
      status: dbOk ? 'ok' : 'error',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      db: dbOk ? 'ok' : 'error',
      latency_ms: Date.now() - start,
    };
    if (!dbOk) throw new ServiceUnavailableException(payload);
    return payload;
  }

  // TEMP: remove after confirming Sentry is working
  @Get('sentry-test')
  sentryTest(): never {
    throw new InternalServerErrorException('Sentry test error — delete this route after confirming');
  }
}
