import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { PaymentsService } from '../payments/payments.service';

// PaymentsService.getAdminDashboard()'s return type is inferred as
// `{ events: any[] }` (its internal .map() callback isn't typed) — narrowed
// here to the two fields actually used, rather than widening the shared
// method's typing as a side effect of this unrelated feature.
interface DashboardEventSummary {
  grossCollectedPaise: number;
  needsRefundAttention: number;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly payments: PaymentsService,
  ) {}

  async getStats() {
    const client = this.supabase.getClient();

    const [
      { count: pendingOrgsCount },
      { count: pendingEventsCount },
      { count: approvedOrgsCount },
      { count: totalVolunteers },
      { count: totalEvents },
      dashboard,
    ] = await Promise.all([
      client
        .from('organization_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('approval_status', 'pending'),
      client
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      client
        .from('organization_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('approval_status', 'approved'),
      client
        .from('volunteer_profiles')
        .select('*', { count: 'exact', head: true }),
      client.from('events').select('*', { count: 'exact', head: true }),
      // Reuse the existing paid-events dashboard rather than re-deriving
      // gross/refund totals from event_payments/event_bills ourselves.
      this.payments.getAdminDashboard(),
    ]);

    const dashboardEvents = dashboard.events as DashboardEventSummary[];
    const grossCollectedPaise = dashboardEvents.reduce(
      (sum, e) => sum + e.grossCollectedPaise,
      0,
    );
    const refundAttentionCount = dashboardEvents.reduce(
      (sum, e) => sum + e.needsRefundAttention,
      0,
    );

    return {
      pendingOrgsCount: pendingOrgsCount ?? 0,
      pendingEventsCount: pendingEventsCount ?? 0,
      approvedOrgsCount: approvedOrgsCount ?? 0,
      totalVolunteers: totalVolunteers ?? 0,
      totalEvents: totalEvents ?? 0,
      grossCollectedPaise,
      refundAttentionCount,
    };
  }

  // First real offset-paginated endpoint in this codebase — every other list
  // endpoint uses a bare .limit(N) with no way to reach the rest (tracked
  // separately as its own backlog item; not retrofitted here).
  async getOrganizations(
    status: string | undefined,
    search: string | undefined,
    page: number,
    pageSize: number,
  ) {
    const client = this.supabase.getClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = client
      .from('organization_profiles')
      .select(
        'id, org_type, name, email, phone, approval_status, area_locality, created_at',
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .range(from, to);

    // 'rejected' is never persisted — setApprovalStatus deletes a rejected
    // org's row outright, so only 'pending'/'approved' ever exist here.
    if (status) query = query.eq('approval_status', status);
    if (search) query = query.ilike('name', `%${search}%`);

    const { data, count, error } = await query;
    if (error) throw error;

    return { organizations: data ?? [], total: count ?? 0, page, pageSize };
  }

  // Mirrors getOrganizations' offset-pagination shape, against volunteers.
  // 'status' filters on suspension state ('active' | 'suspended') since
  // volunteers have no approval_status equivalent.
  async getVolunteers(
    status: string | undefined,
    search: string | undefined,
    page: number,
    pageSize: number,
  ) {
    const client = this.supabase.getClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = client
      .from('volunteer_profiles')
      .select(
        'id, full_name, email, phone, city, total_hours, is_verified, suspended_at, created_at',
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status === 'suspended') query = query.not('suspended_at', 'is', null);
    if (status === 'active') query = query.is('suspended_at', null);
    if (search) query = query.ilike('full_name', `%${search}%`);

    const { data, count, error } = await query;
    if (error) throw error;

    return { volunteers: data ?? [], total: count ?? 0, page, pageSize };
  }

  // Mirrors getOrganizations' offset-pagination shape, against events instead.
  async getEvents(
    status: string | undefined,
    search: string | undefined,
    page: number,
    pageSize: number,
  ) {
    const client = this.supabase.getClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = client
      .from('events')
      .select(
        'id, title, status, category, event_date, start_time, location, registered_count, total_slots, organization_profiles ( id, name )',
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status) query = query.eq('status', status);
    if (search) query = query.ilike('title', `%${search}%`);

    const { data, count, error } = await query;
    if (error) throw error;

    return { events: data ?? [], total: count ?? 0, page, pageSize };
  }

  async getAuditLog(
    action: string | undefined,
    targetType: string | undefined,
    page: number,
    pageSize: number,
  ) {
    const client = this.supabase.getClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = client
      .from('audit_log')
      .select(
        'id, actor_id, actor_email, action, target_type, target_id, metadata, created_at',
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .range(from, to);

    if (action) query = query.eq('action', action);
    if (targetType) query = query.eq('target_type', targetType);

    const { data, count, error } = await query;
    if (error) throw error;

    return { entries: data ?? [], total: count ?? 0, page, pageSize };
  }
}
