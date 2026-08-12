import { IsUUID } from 'class-validator';
import { CreateEventDto } from './create-event.dto';

// Admin creating an event on behalf of an org — same shape/validation as the
// org's own CreateEventDto, plus an explicit target org id (the org isn't
// resolved from the caller's own profile, since the caller is an admin).
export class AdminCreateEventDto extends CreateEventDto {
  @IsUUID()
  organizationId: string;
}
