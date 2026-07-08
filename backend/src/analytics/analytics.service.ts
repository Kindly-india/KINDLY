import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { eventHours } from '../common/hours.util';

@Injectable()
export class AnalyticsService {
    constructor(private readonly supabase: SupabaseService) { }

    async getVolunteerImpact(userId: string) {
        const client = this.supabase.getClient();

        const { data: vol, error: volError } = await client
            .from('volunteer_profiles')
            .select('id, created_at')
            .eq('user_id', userId)
            .single();

        if (volError || !vol) {
            console.error("❌ No Volunteer Profile found.");
            return null;
        }

        // 1. Fetch ALL registrations
        const { data: rawHistory, error: historyError } = await client
            .from('event_registrations')
            .select(`
        status,
        events (
          id, title, category, event_date, start_time, end_time, location
        )
      `)
            .eq('volunteer_id', vol.id);

        if (historyError) {
            console.error("❌ History Fetch Error:", historyError);
        }

        // ✅ FIX: Ensure history is always an array (never null)
        const history = rawHistory || [];

        // --- CALCULATIONS ---
        let verifiedHours = 0;
        let pendingHours = 0;
        let eventsAttended = 0;
        let eventsRegistered = 0;
        const skillsSet = new Set<string>();
        const sdgSet = new Set<string>();

        history.forEach(r => {
            const evt = r.events as any;
            if (!evt) return;

            // Case-insensitive status check
            const status = (r.status || '').toLowerCase();
            const isVerified = status === 'completed' || status === 'checked_in';
            const isRegistered = status === 'registered';

            // Duration Logic (single source: eventHours — overnight-aware, 2dp)
            const duration = eventHours(evt.start_time, evt.end_time);

            if (isVerified) {
                verifiedHours += duration;
                eventsAttended++;
            } else if (isRegistered) {
                pendingHours += duration;
                eventsRegistered++;
            }

            // Skills & SDGs
            if (evt.category) {
                const cat = evt.category.toLowerCase();
                if (cat.includes('education') || cat.includes('mentor') || cat.includes('teach')) { skillsSet.add('Mentoring'); skillsSet.add('Public Speaking'); sdgSet.add('SDG 4: Quality Education'); }
                if (cat.includes('nature') || cat.includes('outdoor') || cat.includes('clean')) { skillsSet.add('Eco-Awareness'); skillsSet.add('Teamwork'); sdgSet.add('SDG 13: Climate Action'); }
                if (cat.includes('health') || cat.includes('medical')) { skillsSet.add('Health Care'); sdgSet.add('SDG 3: Good Health'); }
                if (cat.includes('animal') || cat.includes('welfare')) { skillsSet.add('Animal Care'); sdgSet.add('Empathy'); }
                if (cat.includes('civic') || cat.includes('community') || cat.includes('food') || cat.includes('donation')) { skillsSet.add('Community Service'); sdgSet.add('SDG 11: Sustainable Cities'); }
                if (cat.includes('elderly') || cat.includes('elder')) { skillsSet.add('Caregiving'); sdgSet.add('SDG 3: Good Health'); }
                if (cat.includes('women') || cat.includes('empowerment')) { skillsSet.add('Advocacy'); sdgSet.add('SDG 5: Gender Equality'); }
                if (cat.includes('mental') || cat.includes('wellness')) { skillsSet.add('Empathy'); sdgSet.add('SDG 3: Good Health'); }
                if (cat.includes('youth') || cat.includes('sports')) { skillsSet.add('Coaching'); sdgSet.add('SDG 3: Good Health'); }
                if (cat.includes('art') || cat.includes('culture')) { skillsSet.add('Creativity'); sdgSet.add('SDG 11: Sustainable Cities'); }
            }
        });

        // Causes Breakdown
        const causesMap = new Map();
        history.forEach(r => {
            const evt = r.events as any;
            const cat = evt?.category || 'General';
            causesMap.set(cat, (causesMap.get(cat) || 0) + 1);
        });
        const causesBreakdown = Array.from(causesMap, ([name, value]) => ({ name, value }));

        // Monthly Activity
        const monthlyActivity = Array(6).fill(0).map((_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - (5 - i));
            return { name: d.toLocaleString('default', { month: 'short' }), hours: 0 };
        });

        history.forEach(r => {
            const status = (r.status || '').toLowerCase();
            if (status === 'completed' || status === 'checked_in') {
                const evt = r.events as any;
                const now = new Date();
                const d = new Date(evt?.event_date);

                const monthsAgo =
                    (now.getFullYear() - d.getFullYear()) * 12 +
                    (now.getMonth() - d.getMonth());

                const monthIndex = 5 - monthsAgo;

                if (monthIndex >= 0 && monthIndex < 6) {
                    monthlyActivity[monthIndex].hours += eventHours(evt?.start_time, evt?.end_time);
                }
            }
        });

        return {
            verifiedHours: Math.round(verifiedHours * 10) / 10,
            pendingHours: Math.round(pendingHours * 10) / 10,
            totalEvents: eventsAttended,
            registeredEvents: eventsRegistered,
            impactScore: Math.round((verifiedHours * 10) + (eventsAttended * 50)),
            causesBreakdown,
            monthlyActivity,
            skills: Array.from(skillsSet),
            sdgs: Array.from(sdgSet),
            joinDate: vol.created_at
        };
    }

    async getOrgAnalytics(userId: string) {
        const client = this.supabase.getClient();

        // 1. Get Org Profile
        const { data: org } = await client
            .from('organization_profiles')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (!org) {
            return null;
        }

        // 2. Fetch Events & Registrations (last 12 months, capped at 200)
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

        const { data: events } = await client
            .from('events')
            .select(`
        id,
        title,
        event_date,
        start_time,
        end_time,
        registered_count,
        event_registrations (
          status,
          volunteer_id,
          volunteer_profiles ( full_name )
        )
      `)
            .eq('organization_id', org.id)
            .gte('event_date', twelveMonthsAgo.toISOString().split('T')[0])
            .limit(200);

        // --- CALCULATIONS ---
        let totalHours = 0;
        let totalVolunteers = new Set();
        let checkedInCount = 0;
        let registeredTotal = 0;
        let cancelledCount = 0;

        const volunteerStats = new Map<string, { name: string, hours: number, role: string }>();
        const monthlyGrowth = new Array(6).fill(0).map((_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - (5 - i));
            return { name: d.toLocaleString('default', { month: 'short' }), monthIdx: d.getMonth(), value: 0 };
        });

        events?.forEach(e => {
            const regs = e.event_registrations || [];
            registeredTotal += regs.length;

            // Per-person event duration (single source: eventHours — overnight-aware, 2dp)
            const eventDuration = eventHours(e.start_time, e.end_time);

            const eDate = new Date(e.event_date);
            const monthEntry = monthlyGrowth.find(m => m.monthIdx === eDate.getMonth());

            regs.forEach(r => {
                const reg = r as any;
                const status = (reg.status || '').toLowerCase();
                const volName = reg.volunteer_profiles?.full_name || 'Volunteer';
                const volId = reg.volunteer_id;

                const hours = eventDuration;

                if (status === 'completed' || status === 'checked_in') {
                    totalHours += hours;
                    checkedInCount++;
                    if (volId) totalVolunteers.add(volId);

                    if (monthEntry) monthEntry.value += hours;

                    if (volId) {
                        const existing = volunteerStats.get(volId) || { name: volName, hours: 0, role: 'Volunteer' };
                        existing.hours += hours;

                        if (existing.hours > 20) existing.role = 'Super Volunteer';
                        else if (existing.hours > 10) existing.role = 'Regular';

                        volunteerStats.set(volId, existing);
                    }
                } else if (status === 'cancelled') {
                    cancelledCount++;
                }
            });
        });

        const turnoutRate = registeredTotal > 0 ? Math.round((checkedInCount / registeredTotal) * 100) : 0;

        const topVolunteers = Array.from(volunteerStats.values())
            .sort((a, b) => b.hours - a.hours)
            .slice(0, 5);

        const eventPerformance = events?.map(e => ({
            title: e.title,
            date: e.event_date,
            volunteers: e.event_registrations.filter(r => ['completed', 'checked_in'].includes((r.status || '').toLowerCase())).length,
            success: e.registered_count > 0
                ? Math.round((e.event_registrations.filter(r => ['completed', 'checked_in'].includes((r.status || '').toLowerCase())).length / e.registered_count) * 100)
                : 0
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

        return {
            totalHoursGenerated: Math.round(totalHours * 10) / 10, // Round to 1 decimal
            uniqueVolunteers: totalVolunteers.size,
            turnoutRate,
            eventsHosted: events?.length || 0,
            monthlyGrowth,
            statusBreakdown: [
                { name: 'Attended', value: checkedInCount },
                { name: 'No-Show', value: Math.max(0, registeredTotal - checkedInCount - cancelledCount) },
                { name: 'Cancelled', value: cancelledCount }
            ],
            topVolunteers,
            eventPerformance
        };
    }

    async getPlatformStats() {
        const client = this.supabase.getClient();
        const { data, error } = await client.rpc('get_platform_stats');
        if (error) throw error;
        return data;
    }
}