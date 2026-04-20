import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class CronSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const secret = request.headers['x-admin-secret'];
    if (!secret || secret !== process.env.CRON_SECRET) {
      throw new UnauthorizedException('Invalid cron secret');
    }
    return true;
  }
}
