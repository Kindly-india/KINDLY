import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('admin')
export class AdminController {
  // Cheap "am I admin" gate check for the frontend's shared admin layout —
  // AdminGuard does the real work; reaching this handler at all means it
  // already passed.
  @Get('me')
  @UseGuards(AdminGuard)
  getMe() {
    return { isAdmin: true };
  }
}
