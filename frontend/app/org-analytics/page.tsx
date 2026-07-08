"use client"

import { useEffect, useRef, useState } from "react"
import { api } from "@/lib/api"
import Link from "next/link"
import { motion } from "framer-motion"
import {
   Loader2, Users, Clock, CalendarCheck,
   Repeat, ArrowUpRight, ArrowDownRight, Download,
   Award, Filter, ArrowLeft, Check,
   Calendar, BarChart3, Sparkles
} from "lucide-react"
import Image from "next/image"
import {
   AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
   PieChart, Pie, Cell
} from "recharts"
import { cn, eventHours, formatHoursTotal } from "@/lib/utils"
import { ScrollReveal } from "@/components/ui/scroll-reveal"

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

type DateRange = 'all' | '30d' | '90d' | '6m' | '1y'

const RANGE_LABELS: Record<DateRange, string> = {
   all: 'All Time',
   '30d': 'Last 30 Days',
   '90d': 'Last 90 Days',
   '6m': 'Last 6 Months',
   '1y': 'Last Year',
}

function cutoffForRange(range: DateRange): Date | null {
   if (range === 'all') return null
   const cutoff = new Date()
   if (range === '30d') cutoff.setDate(cutoff.getDate() - 30)
   else if (range === '90d') cutoff.setDate(cutoff.getDate() - 90)
   else if (range === '6m') cutoff.setMonth(cutoff.getMonth() - 6)
   else if (range === '1y') cutoff.setFullYear(cutoff.getFullYear() - 1)
   return cutoff
}

// Pure so it can be re-run client-side whenever the date filter changes,
// without re-fetching registrations for every event again.
function computeAnalytics(allData: any[]) {
   let totalHours = 0;
   let checkedInCount = 0;
   let registeredTotal = 0;
   let cancelledCount = 0;
   const uniqueVolunteers = new Set();
   const volStats = new Map();

   // Initialize 6-month growth chart
   const monthlyGrowth = new Array(6).fill(0).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return {
         name: d.toLocaleString('default', { month: 'short' }),
         monthIdx: d.getMonth(),
         value: 0
      };
   });

   allData.forEach((ev: any) => {
      // A. Calculate Duration (single source: eventHours — overnight-aware, 2dp)
      const duration = eventHours(ev.start_time, ev.end_time);

      // B. Growth Chart Helper
      const evDate = new Date(ev.event_date);
      const monthEntry = monthlyGrowth.find(m => m.monthIdx === evDate.getMonth());

      // C. Process Registrations
      const regs = ev.registrations || [];
      registeredTotal += regs.length;

      regs.forEach((r: any) => {
         const status = (r.status || '').toLowerCase();
         const volId = r.volunteer_id || r.volunteer_profiles?.id;
         const volName = r.volunteer_profiles?.full_name || 'Volunteer';

         if (status === 'completed' || status === 'checked_in') {
            totalHours += duration; // Add event duration
            checkedInCount++;
            if (volId) uniqueVolunteers.add(volId);

            // Add to Growth
            if (monthEntry) monthEntry.value += duration;

            // Add to Leaderboard
            if (volId) {
               const existing = volStats.get(volId) || { name: volName, hours: 0, role: 'Volunteer' };
               existing.hours += duration;
               if (existing.hours > 10) existing.role = 'Super Volunteer';
               volStats.set(volId, existing);
            }
         } else if (status === 'cancelled') {
            cancelledCount++;
         }
      });
   });

   // --- REPEAT VOLUNTEER RATE ---
   // For each volunteer, count how many distinct completed events they attended
   const volunteerEventCounts = new Map<string, Set<string>>();
   allData.forEach((ev: any) => {
      if (ev.status !== 'completed') return;
      (ev.registrations || []).forEach((r: any) => {
         const status = (r.status || '').toLowerCase();
         const volId = r.volunteer_id || r.volunteer_profiles?.id;
         if ((status === 'checked_in' || status === 'completed') && volId) {
            if (!volunteerEventCounts.has(volId)) volunteerEventCounts.set(volId, new Set());
            volunteerEventCounts.get(volId)!.add(ev.id);
         }
      });
   });
   const attendedAtLeastOne = Array.from(volunteerEventCounts.values()).filter(s => s.size >= 1).length;
   const attendedAtLeastTwo = Array.from(volunteerEventCounts.values()).filter(s => s.size >= 2).length;
   const repeatVolunteerRate = attendedAtLeastOne > 0 ? Math.round((attendedAtLeastTwo / attendedAtLeastOne) * 100) : 0;

   // --- FINAL FORMATTING ---

   // 1. Leaderboard (Top 5)
   const topVolunteers = Array.from(volStats.values())
      .sort((a: any, b: any) => b.hours - a.hours)
      .slice(0, 5);

   // 2. Status Breakdown
   const statusBreakdown = [
      { name: 'Attended', value: checkedInCount },
      { name: 'No-Show', value: Math.max(0, registeredTotal - checkedInCount - cancelledCount) },
      { name: 'Cancelled', value: cancelledCount }
   ];

   // 3. Event Performance Table
   const recentEvents = [...allData]
      .sort((a: any, b: any) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
      .slice(0, 5)
      .map((ev: any) => {
         const attended = ev.registrations.filter((r: any) => ['completed', 'checked_in'].includes(r.status)).length;
         const total = ev.registrations.length;
         return {
            title: ev.title,
            date: ev.event_date,
            success: total > 0 ? Math.round((attended / total) * 100) : 0
         };
      });

   return {
      totalHours: Math.round(totalHours * 10) / 10,
      totalVolunteers: uniqueVolunteers.size,
      eventsHosted: allData.length,
      turnoutRate: registeredTotal > 0 ? Math.round((checkedInCount / registeredTotal) * 100) : 0,
      repeatVolunteerRate,
      monthlyGrowth,
      statusBreakdown,
      topVolunteers,
      recentEvents
   };
}

function downloadAnalyticsCsv(data: ReturnType<typeof computeAnalytics>, rangeLabel: string) {
   const rows: string[] = []
   const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`

   rows.push(escape('KINDLY Analytics Export'))
   rows.push(`${escape('Range')},${escape(rangeLabel)}`)
   rows.push(`${escape('Generated')},${escape(new Date().toLocaleString())}`)
   rows.push('')
   rows.push(escape('Summary'))
   rows.push(`${escape('Metric')},${escape('Value')}`)
   rows.push(`${escape('Total Impact Hours')},${data.totalHours}`)
   rows.push(`${escape('Unique Volunteers')},${data.totalVolunteers}`)
   rows.push(`${escape('Events Hosted')},${data.eventsHosted}`)
   rows.push(`${escape('Turnout Reliability')},${data.turnoutRate}%`)
   rows.push(`${escape('Repeat Volunteer Rate')},${data.repeatVolunteerRate}%`)
   rows.push('')
   rows.push(escape('Star Volunteers'))
   rows.push(`${escape('Name')},${escape('Hours')},${escape('Role')}`)
   data.topVolunteers.forEach((v: any) => rows.push(`${escape(v.name)},${Math.round(v.hours)},${escape(v.role)}`))
   rows.push('')
   rows.push(escape('Event Performance'))
   rows.push(`${escape('Event Name')},${escape('Date')},${escape('Turnout %')}`)
   data.recentEvents.forEach((e: any) => rows.push(`${escape(e.title)},${escape(new Date(e.date).toLocaleDateString())},${e.success}`))

   const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
   const url = URL.createObjectURL(blob)
   const a = document.createElement('a')
   a.href = url
   a.download = `kindly-analytics-${new Date().toISOString().slice(0, 10)}.csv`
   document.body.appendChild(a)
   a.click()
   document.body.removeChild(a)
   URL.revokeObjectURL(url)
}

export default function OrgAnalyticsPage() {
   const [loading, setLoading] = useState(true)

   // --- Navbar State (Preserved for desktop profile icon) ---
   const [profile, setProfile] = useState<any>(null)

   // --- Raw fetched events (with registrations attached), unfiltered ---
   const [rawEvents, setRawEvents] = useState<any[]>([])
   const [dateRange, setDateRange] = useState<DateRange>('all')
   const [showFilterMenu, setShowFilterMenu] = useState(false)
   const filterMenuRef = useRef<HTMLDivElement>(null)

   // --- Analytics State (derived from rawEvents + dateRange, see effect below) ---
   const [data, setData] = useState(() => computeAnalytics([]))

   useEffect(() => {
      const fetchData = async () => {
         try {
            setLoading(true);

            // 1. Fetch Events & Profile (Parallel)
            const [eventsRes, profileRes] = await Promise.all([
               api.getMyEvents(),
               api.getUserProfile()
            ]);

            const events = eventsRes.events || [];
            setProfile(profileRes?.profile || null); // Set profile for Navbar

            // 2. Fetch Registrations for ALL events to get details
            const allData = await Promise.all(
               events.map(async (ev: any) => {
                  const regRes = await api.getEventRegistrations(ev.id);
                  return { ...ev, registrations: regRes.registrations || [] };
               })
            );

            setRawEvents(allData);
         } catch (err) {
            console.error("Failed to load analytics data:", err)
         } finally {
            setLoading(false)
         }
      }
      fetchData()
   }, [])

   // Recompute derived stats client-side whenever the raw data or the date
   // filter changes — no refetch needed, filtering is just a date comparison.
   useEffect(() => {
      const cutoff = cutoffForRange(dateRange)
      const filtered = cutoff
         ? rawEvents.filter((ev: any) => new Date(ev.event_date) >= cutoff)
         : rawEvents
      setData(computeAnalytics(filtered))
   }, [rawEvents, dateRange])

   // Close the filter dropdown on outside click
   useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
         if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
            setShowFilterMenu(false)
         }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
   }, [])

   // Helper for displaying profile image/initials
   const displayImage = profile?.logo_url || profile?.avatar_url
   const displayName = profile?.name || profile?.full_name || "Org"
   const displayInitial = displayName.charAt(0)

   if (loading) {
      return (
         <div className="h-screen flex items-center justify-center bg-neutral-50 dark:bg-black">
            <Loader2 className="w-8 h-8 animate-spin text-[#ff6b6b]" />
         </div>
      )
   }

   return (
      <div className="min-h-screen bg-neutral-50 dark:bg-black pb-20 relative overflow-hidden">
         <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-[#ff6b6b]/[0.1] dark:from-[#ff6b6b]/[0.08] to-transparent blur-3xl" />

         {[
            { icon: BarChart3, color: "text-blue-400", pos: "top-20 left-8", delay: 0 },
            { icon: Sparkles, color: "text-amber-500", pos: "top-32 right-16", delay: 0.8 },
         ].map(({ icon: Icon, color, pos, delay }, i) => (
            <motion.div
               key={i}
               animate={{ y: [0, -10, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay }}
               className={cn("fixed w-12 h-12 bg-white/70 dark:bg-neutral-900/50 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-xl shadow-lg shadow-neutral-200/40 dark:shadow-black/40 hidden md:flex items-center justify-center pointer-events-none", pos)}
            >
               <Icon className={cn("w-5 h-5", color)} />
            </motion.div>
         ))}

         {/* 1. Header Section */}
         <div className="relative z-30 bg-white/70 dark:bg-neutral-900/50 backdrop-blur-xl border-b border-black/5 dark:border-white/10">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-5 md:py-6">
               <ScrollReveal className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                  <div className="flex items-start md:items-center gap-3 md:gap-4">
                     <Link href="/org-home" className="p-1.5 md:p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors mt-1 md:mt-0 shrink-0">
                        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                     </Link>
                     <div>
                        <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">Organization Command Center</h1>
                        <p className="text-xs md:text-sm text-muted-foreground mt-1">Real-time performance metrics and impact reporting.</p>
                     </div>
                  </div>
                  {/* Action Buttons - Stacked horizontally on mobile with flex-1 */}
                  <div className="flex gap-2 md:gap-3 pl-11 md:pl-0">
                     <div ref={filterMenuRef} className="relative flex-1 md:flex-none">
                        <button
                           onClick={() => setShowFilterMenu(v => !v)}
                           className="w-full justify-center px-3 md:px-4 py-2 md:py-2 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl border border-black/10 dark:border-white/10 text-foreground font-semibold rounded-lg text-xs md:text-sm flex items-center gap-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                           <Filter className="w-3.5 h-3.5 md:w-4 md:h-4" /> {RANGE_LABELS[dateRange]}
                        </button>
                        {showFilterMenu && (
                           <div className="absolute right-0 top-full mt-2 w-48 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl rounded-xl border border-black/5 dark:border-white/10 shadow-xl shadow-black/10 dark:shadow-black/40 z-50 overflow-hidden">
                              {(Object.keys(RANGE_LABELS) as DateRange[]).map((r) => (
                                 <button
                                    key={r}
                                    onClick={() => { setDateRange(r); setShowFilterMenu(false) }}
                                    className={cn(
                                       "w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/10 transition-colors",
                                       dateRange === r ? "font-semibold text-[#ff6b6b]" : "text-foreground"
                                    )}
                                 >
                                    {RANGE_LABELS[r]}
                                    {dateRange === r && <Check className="w-3.5 h-3.5" />}
                                 </button>
                              ))}
                           </div>
                        )}
                     </div>
                     <button
                        onClick={() => downloadAnalyticsCsv(data, RANGE_LABELS[dateRange])}
                        className="flex-1 md:flex-none justify-center px-3 md:px-4 py-2 md:py-2 bg-[#ff6b6b] hover:bg-[#ee5a5a] text-white font-semibold rounded-lg text-xs md:text-sm flex items-center gap-1.5 hover:scale-105 transition-all shadow-sm shadow-[#ff6b6b]/20"
                     >
                        <Download className="w-3.5 h-3.5 md:w-4 md:h-4" /> Export
                     </button>
                  </div>
               </ScrollReveal>
            </div>
         </div>

         <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8">

            {/* 2. ROI & High-Level KPI Cards - Changed to 2x2 grid on mobile */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
               {/* Total Hours */}
               <ScrollReveal delay={0}>
                  <div className="h-full bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl p-4 md:p-6 rounded-xl border border-black/5 dark:border-white/5 shadow-xl shadow-neutral-200/30 dark:shadow-2xl dark:shadow-black/50 hover:scale-[1.02] transition-transform duration-300 ease-out flex flex-col justify-between">
                     <div className="flex justify-between items-start mb-3 md:mb-4">
                        <div className="p-1.5 md:p-2 bg-[#ff6b6b]/10 rounded-lg"><Clock className="w-4 h-4 md:w-5 md:h-5 text-[#ff6b6b]" /></div>
                        {data.totalHours > 0 && <span className="flex items-center text-[10px] md:text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15 px-1.5 md:px-2 py-0.5 rounded-full"><ArrowUpRight className="w-2.5 h-2.5 md:w-3 md:h-3 mr-0.5 md:mr-1" />Live</span>}
                     </div>
                     <div>
                        <p className="text-2xl md:text-3xl font-bold text-[#ff6b6b]">{formatHoursTotal(data.totalHours)}</p>
                        <p className="text-[11px] md:text-sm text-muted-foreground mt-0.5 md:mt-1 leading-tight">Total Impact Hours</p>
                     </div>
                  </div>
               </ScrollReveal>

               {/* Repeat Volunteer Rate */}
               <ScrollReveal delay={0.05}>
                  <div className="h-full bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl p-4 md:p-6 rounded-xl border border-black/5 dark:border-white/5 shadow-xl shadow-neutral-200/30 dark:shadow-2xl dark:shadow-black/50 hover:scale-[1.02] transition-transform duration-300 ease-out flex flex-col justify-between">
                     <div className="flex justify-between items-start mb-3 md:mb-4">
                        <div className="p-1.5 md:p-2 bg-violet-50 dark:bg-violet-500/15 rounded-lg"><Repeat className="w-4 h-4 md:w-5 md:h-5 text-violet-600 dark:text-violet-400" /></div>
                     </div>
                     <div>
                        <p className="text-2xl md:text-3xl font-bold text-foreground">{data.repeatVolunteerRate}%</p>
                        <p className="text-[11px] md:text-sm text-muted-foreground mt-0.5 md:mt-1 leading-tight">Repeat Volunteer Rate</p>
                        <p className="text-[10px] md:text-[11px] text-muted-foreground mt-0.5 leading-tight">Came back for 2+ events</p>
                     </div>
                  </div>
               </ScrollReveal>

               {/* Unique Volunteers */}
               <ScrollReveal delay={0.1}>
                  <div className="h-full bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl p-4 md:p-6 rounded-xl border border-black/5 dark:border-white/5 shadow-xl shadow-neutral-200/30 dark:shadow-2xl dark:shadow-black/50 hover:scale-[1.02] transition-transform duration-300 ease-out flex flex-col justify-between">
                     <div className="flex justify-between items-start mb-3 md:mb-4">
                        <div className="p-1.5 md:p-2 bg-purple-50 dark:bg-purple-500/15 rounded-lg"><Users className="w-4 h-4 md:w-5 md:h-5 text-purple-600 dark:text-purple-400" /></div>
                     </div>
                     <div>
                        <p className="text-2xl md:text-3xl font-bold text-foreground">{data.totalVolunteers}</p>
                        <p className="text-[11px] md:text-sm text-muted-foreground mt-0.5 md:mt-1 leading-tight">Unique Volunteers</p>
                     </div>
                  </div>
               </ScrollReveal>

               {/* Reliability Score */}
               <ScrollReveal delay={0.15}>
                  <div className="h-full bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl p-4 md:p-6 rounded-xl border border-black/5 dark:border-white/5 shadow-xl shadow-neutral-200/30 dark:shadow-2xl dark:shadow-black/50 hover:scale-[1.02] transition-transform duration-300 ease-out flex flex-col justify-between">
                     <div className="flex justify-between items-start mb-3 md:mb-4">
                        <div className="p-1.5 md:p-2 bg-orange-50 dark:bg-orange-500/15 rounded-lg"><CalendarCheck className="w-4 h-4 md:w-5 md:h-5 text-orange-600 dark:text-orange-400" /></div>
                     </div>
                     <div>
                        <p className="text-2xl md:text-3xl font-bold text-foreground">{data.turnoutRate}%</p>
                        <p className="text-[11px] md:text-sm text-muted-foreground mt-0.5 md:mt-1 leading-tight">Turnout Reliability</p>
                     </div>
                  </div>
               </ScrollReveal>
            </div>

            {/* 3. Deep Dive Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

               {/* Left: Impact Growth (Area Chart) */}
               <ScrollReveal className="md:col-span-2">
                  <div className="bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl p-4 md:p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-xl shadow-neutral-200/30 dark:shadow-2xl dark:shadow-black/50">
                     <div className="flex items-center justify-between mb-4 md:mb-6">
                        <h3 className="text-sm md:text-base font-bold text-foreground">Impact Growth</h3>
                        <span className="text-[10px] md:text-xs text-muted-foreground">Last 6 Months</span>
                     </div>
                     <div className="h-56 md:h-72">
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={data.monthlyGrowth}>
                              <defs>
                                 <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0} />
                                 </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                              <YAxis axisLine={false} tickLine={false} fontSize={11} stroke="var(--muted-foreground)" width={30} />
                              <Tooltip
                                 contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px', backgroundColor: 'var(--card)' }}
                                 itemStyle={{ color: 'var(--card-foreground)' }}
                                 labelStyle={{ color: 'var(--muted-foreground)' }}
                              />
                              <Area type="monotone" dataKey="value" stroke="#ff6b6b" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
               </ScrollReveal>

               {/* Right: Reliability Breakdown (Pie Chart) */}
               <ScrollReveal delay={0.1}>
                  <div className="bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl p-4 md:p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-xl shadow-neutral-200/30 dark:shadow-2xl dark:shadow-black/50">
                     <h3 className="text-sm md:text-base font-bold text-foreground mb-1 md:mb-2">Volunteer Reliability</h3>
                     <p className="text-[10px] md:text-xs text-muted-foreground mb-4 md:mb-6">Based on check-in vs registration data</p>
                     <div className="h-40 md:h-48">
                        <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                              <Pie data={data.statusBreakdown} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                 {data.statusBreakdown.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                 ))}
                              </Pie>
                              <Tooltip
                                 contentStyle={{ fontSize: '12px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                 itemStyle={{ color: 'var(--card-foreground)' }}
                                 labelStyle={{ color: 'var(--muted-foreground)' }}
                              />
                           </PieChart>
                        </ResponsiveContainer>
                     </div>
                     <div className="flex justify-center flex-wrap gap-3 md:gap-4 mt-4">
                        {data.statusBreakdown.map((item, i) => (
                           <div key={i} className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                              <span className="text-[11px] md:text-xs text-muted-foreground">{item.name}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </ScrollReveal>
            </div>

            {/* 4. Bottom Row: Leaderboard & Recent Events */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

               {/* Top Volunteers Leaderboard */}
               <ScrollReveal>
                  <div className="bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-2xl border border-black/5 dark:border-white/5 shadow-xl shadow-neutral-200/30 dark:shadow-2xl dark:shadow-black/50 overflow-hidden">
                     <div className="px-4 md:px-6 py-4 md:py-5 border-b border-black/5 dark:border-white/10 flex justify-between items-center">
                        <h3 className="text-sm md:text-base font-bold text-foreground">Star Volunteers</h3>
                     </div>
                     <div className="divide-y divide-black/5 dark:divide-white/10">
                        {data.topVolunteers.length > 0 ? (
                           data.topVolunteers.map((vol, i) => (
                              <div key={i} className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-[#ff6b6b]/15 to-purple-400/15 flex items-center justify-center font-bold text-[#ff6b6b] text-xs md:text-sm shrink-0">
                                       {vol.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                       <p className="text-xs md:text-sm font-semibold text-foreground truncate">{vol.name}</p>
                                       <p className="text-[10px] md:text-xs text-muted-foreground truncate">{vol.role}</p>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-2 pl-2">
                                    <span className="px-2 py-1 bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 rounded-md text-[10px] md:text-xs font-bold border border-amber-100 dark:border-amber-500/20 flex items-center gap-1 shrink-0">
                                       <Award className="w-3 h-3 hidden sm:block" /> {formatHoursTotal(vol.hours)} hrs
                                    </span>
                                 </div>
                              </div>
                           ))
                        ) : (
                           <div className="p-6 text-center text-xs md:text-sm text-muted-foreground italic">
                              No volunteer data available yet.
                           </div>
                        )}
                     </div>
                  </div>
               </ScrollReveal>

               {/* Recent Event Performance */}
               <ScrollReveal delay={0.1}>
                  <div className="bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-2xl border border-black/5 dark:border-white/5 shadow-xl shadow-neutral-200/30 dark:shadow-2xl dark:shadow-black/50 overflow-hidden">
                     <div className="px-4 md:px-6 py-4 md:py-5 border-b border-black/5 dark:border-white/10">
                        <h3 className="text-sm md:text-base font-bold text-foreground">Event Performance Matrix</h3>
                     </div>
                     <div className="overflow-x-auto scrollbar-hide">
                        <table className="w-full text-xs md:text-sm text-left">
                           <thead className="bg-black/[0.02] dark:bg-white/[0.03] text-muted-foreground font-semibold whitespace-nowrap">
                              <tr>
                                 <th className="px-4 md:px-6 py-3">Event Name</th>
                                 <th className="px-4 md:px-6 py-3">Date</th>
                                 <th className="px-4 md:px-6 py-3 text-right">Turnout</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-black/5 dark:divide-white/10">
                              {data.recentEvents.map((ev, i) => (
                                 <tr key={i} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors">
                                    <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-foreground max-w-[120px] md:max-w-none truncate">{ev.title}</td>
                                    <td className="px-4 md:px-6 py-3 md:py-4 text-muted-foreground whitespace-nowrap">{new Date(ev.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</td>
                                    <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                                       <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] md:text-xs font-semibold ${ev.success >= 90 ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' :
                                          ev.success >= 70 ? 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400' : 'bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-400'
                                          }`}>
                                          {ev.success || 0}%
                                       </span>
                                    </td>
                                 </tr>
                              ))}
                              {data.recentEvents.length === 0 && (
                                 <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground italic text-xs md:text-sm">No recent events found.</td>
                                 </tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </ScrollReveal>

            </div>

         </div>
      </div>
   )
}