import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class VolunteerContactService {
  constructor(private supabaseService: SupabaseService) {}

  async savePhone(userId: string, phone: string): Promise<void> {
    const supabase = this.supabaseService.getClient();
    const { error } = await supabase
      .from('volunteer_profiles')
      .update({ phone })
      .eq('user_id', userId);
    if (error) throw new BadRequestException('Failed to save phone number.');
  }
}
