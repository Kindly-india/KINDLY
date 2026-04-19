import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

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
        hours_contributed,
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

            // Duration Logic
            let duration = r.hours_contributed || 0;
            if (!duration && evt.start_time && evt.end_time) {
                const [sh, sm] = evt.start_time.split(':').map(Number);
                const [eh, em] = evt.end_time.split(':').map(Number);
                duration = Math.max(0, (eh * 60 + em) - (sh * 60 + sm)) / 60;
            }

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
                const now = new Date();
                const d = new Date((r.events as any)?.event_date);

                const monthsAgo =
                    (now.getFullYear() - d.getFullYear()) * 12 +
                    (now.getMonth() - d.getMonth());

                const monthIndex = 5 - monthsAgo;

                if (monthIndex >= 0 && monthIndex < 6) {
                    monthlyActivity[monthIndex].hours += (r.hours_contributed || 1);
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

        // 2. Fetch Events & Registrations
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
          hours_contributed,
          volunteer_id,
          volunteer_profiles ( full_name )
        )
      `)
            .eq('organization_id', org.id);

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

            // Calculate Default Duration from Event Times (The Fix!)
            let eventDuration = 0;
            if (e.start_time && e.end_time) {
                const [sh, sm] = e.start_time.split(':').map(Number);
                const [eh, em] = e.end_time.split(':').map(Number);
                eventDuration = Math.max(0, (eh * 60 + em) - (sh * 60 + sm)) / 60;
            }

            const eDate = new Date(e.event_date);
            const monthEntry = monthlyGrowth.find(m => m.monthIdx === eDate.getMonth());

            regs.forEach(r => {
                const reg = r as any;
                const status = (reg.status || '').toLowerCase();
                const volName = reg.volunteer_profiles?.full_name || 'Volunteer';
                const volId = reg.volunteer_id;

                // ✅ FIX: If hours_contributed is missing, use Event Duration
                const hours = reg.hours_contributed || eventDuration || 0;

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

        const [
            { count: volunteers },
            { count: organisations },
            { data: hoursData },
            { data: citiesData },
        ] = await Promise.all([
            client.from('volunteer_profiles').select('*', { count: 'exact', head: true }),
            client.from('organization_profiles').select('*', { count: 'exact', head: true }).eq('approval_status', 'approved'),
            client.from('volunteer_profiles').select('total_hours'),
            client.from('volunteer_profiles').select('city'),
        ]);

        const hours = hoursData?.reduce((sum, v) => sum + (v.total_hours || 0), 0) ?? 0;
        const cities = new Set(citiesData?.map(v => v.city).filter(Boolean)).size;

        return { volunteers, organisations, hours, cities };
    }
}