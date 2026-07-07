import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { EmailModule } from '../email/email.module';

// NOTE: there is no self-issued JWT / Passport strategy here. Auth is validated
// by calling Supabase (supabase.auth.getUser(token)) inside JwtAuthGuard /
// OptionalAuthGuard. The old @nestjs/jwt + passport-jwt scaffolding (JwtModule,
// PassportModule, JwtStrategy, OptionalJwtAuthGuard, JWT_SECRET) was never used
// to sign or verify anything and has been removed.
@Module({
  imports: [SupabaseModule, EmailModule],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
