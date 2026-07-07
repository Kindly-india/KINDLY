import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Rate-limits authenticated requests per USER and unauthenticated ones per IP.
 *
 * KINDLY's audience shares public IPs (college/office NAT, mobile carriers), so
 * keying logged-in actions by IP would throttle many distinct users as if they
 * were one person. We key by the JWT `sub` when a bearer token is present, and
 * fall back to the (proxy-aware) client IP otherwise — which is exactly what we
 * want for unauthenticated, abuse-prone endpoints (signup, OTP pre-flight).
 *
 * The `sub` is read from the token WITHOUT verifying it — fine for a rate-limit
 * key, because the endpoint's real guard still validates the token, so a forged
 * sub can only ever 401 (it can't perform any action). req.ip is only accurate
 * because main.ts sets `trust proxy`.
 */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const auth: string | undefined = req.headers?.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      const sub = decodeJwtSub(auth.slice(7));
      if (sub) return `user:${sub}`;
    }
    return `ip:${req.ip}`;
  }
}

function decodeJwtSub(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = Buffer.from(
      payload.replace(/-/g, '+').replace(/_/g, '/'),
      'base64',
    ).toString('utf8');
    const sub = JSON.parse(json)?.sub;
    return typeof sub === 'string' ? sub : null;
  } catch {
    return null;
  }
}
