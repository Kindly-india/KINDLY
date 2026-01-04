import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return true; // Continue without auth
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      const supabase = this.supabaseService.getClient();
      const { data: { user } } = await supabase.auth.getUser(token);

      if (user) {
        request.user = user;
      }
    } catch (error) {
      // Ignore errors, continue without auth
    }

    return true;
  }
}