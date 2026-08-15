import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminService } from './admin.service';
import { SupabaseService } from '../supabase/supabase.service';

function parsePage(page: string | undefined): number {
  const n = parseInt(page ?? '1', 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function parsePageSize(pageSize: string | undefined): number {
  const n = parseInt(pageSize ?? '20', 10);
  if (!Number.isFinite(n) || n < 1) return 20;
  return Math.min(n, 100);
}

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly supabaseService: SupabaseService,
  ) {}

  // Cheap "am I admin" gate check for the frontend's shared admin layout —
  // AdminGuard does the real work; reaching this handler at all means it
  // already passed. isSuperAdmin additionally lets the frontend hide
  // superadmin-only actions (hard delete) from regular admins instead of
  // showing a button that would just 403.
  @Get('me')
  async getMe(@Request() req: any) {
    return {
      isAdmin: true,
      isSuperAdmin: await this.supabaseService.isSuperAdmin(req.user.id),
    };
  }

  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('organizations')
  async getOrganizations(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminService.getOrganizations(
      status,
      search,
      parsePage(page),
      parsePageSize(pageSize),
    );
  }

  @Get('volunteers')
  async getVolunteers(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminService.getVolunteers(
      status,
      search,
      parsePage(page),
      parsePageSize(pageSize),
    );
  }

  @Get('events')
  async getEvents(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminService.getEvents(
      status,
      search,
      parsePage(page),
      parsePageSize(pageSize),
    );
  }

  @Get('audit-log')
  async getAuditLog(
    @Query('action') action?: string,
    @Query('targetType') targetType?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminService.getAuditLog(
      action,
      targetType,
      parsePage(page),
      parsePageSize(pageSize),
    );
  }
}
