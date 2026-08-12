import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No authorization token provided');
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      const supabase = this.supabaseService.getClient();

      // Verify token with Supabase
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        throw new UnauthorizedException('Invalid token');
      }

      // Suspension check — the real enforcement point for P2-19's
      // suspend/disable feature. AuthService.checkOrgStatus only blocks
      // *new* OTP requests; this is what cuts off an already-issued,
      // still-valid session the moment an admin suspends the account,
      // since every guarded request re-checks here. Same "extra live DB
      // lookup per request" shape AdminGuard already uses for isAdmin — a
      // user is 1:1 either an org or a volunteer, never both, so exactly
      // one of these two ever returns a row.
      const [{ data: org }, { data: vol }] = await Promise.all([
        supabase
          .from('organization_profiles')
          .select('suspended_at')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('volunteer_profiles')
          .select('suspended_at')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      if (org?.suspended_at || vol?.suspended_at) {
        throw new ForbiddenException('Account suspended');
      }

      // Attach user to request
      request.user = user;
      return true;
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
