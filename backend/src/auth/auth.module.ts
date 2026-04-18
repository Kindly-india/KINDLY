import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from './dto/optional-jwt-auth.guard'; // 👈 IMPORT THIS
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    SupabaseModule,
    EmailModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    JwtStrategy, 
    JwtAuthGuard, 
    OptionalJwtAuthGuard // 👈 ADD THIS
  ],
  exports: [
    AuthService, 
    JwtAuthGuard, 
    OptionalJwtAuthGuard, // 👈 EXPORT THIS
    JwtModule
  ], 
})
export class AuthModule {}