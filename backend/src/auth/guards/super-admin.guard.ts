import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

// Stricter than AdminGuard — requires role = 'superadmin' in admin_users,
// not just any admin row. Reserved for genuinely irreversible actions
// (hard-deleting an org/volunteer, which cascade-deletes real data) that
// the two founding admins wanted restricted to themselves specifically.
@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No authorization token provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = this.supabaseService.getClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (!(await this.supabaseService.isSuperAdmin(user.id))) {
      throw new ForbiddenException(
        'This action is restricted to a super admin',
      );
    }

    request.user = user;
    return true;
  }
}
