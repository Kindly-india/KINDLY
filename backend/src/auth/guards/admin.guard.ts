import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No authorization token provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = this.supabaseService.getClient();

    // Step 1: validate the token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Step 2: check is_admin on volunteer_profiles
    const { data: profile, error: profileError } = await supabase
      .from('volunteer_profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile || !profile.is_admin) {
      throw new ForbiddenException('Admin access required');
    }

    request.user = user;
    return true;
  }
}
