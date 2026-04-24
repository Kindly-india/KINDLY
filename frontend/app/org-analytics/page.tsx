"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
   Loader2, Users, Clock, CalendarCheck,
   Repeat, ArrowUpRight, ArrowDownRight, Download,
   Award, Filter, ArrowLeft,
   Calendar, BarChart3
} from "lucide-react"
import Image from "next/image"
import {
   AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
   PieChart, Pie, Cell
} from "recharts"

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

export default function OrgAnalyticsPage() {
   const pathname = usePathname()
   const [loading, setLoading] = useState(true)

   // --- Navbar State (Preserved for desktop profile icon) ---
   const [profile, setProfile] = useState<any>(null)

   // --- Analytics State ---
   const [data, setData] = useState({
      totalHours: 0,
      totalVolunteers: 0,
      eventsHosted: 0,
      turnoutRate: 0,
      repeatVolunteerRate: 0,
      monthlyGrowth: [] as any[],
      statusBreakdown: [] as any[],
      topVolunteers: [] as any[],
      recentEvents: [] as any[]
   })

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

            // --- PERFORM CALCULATIONS LOCALLY ---
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
               // A. Calculate Duration
               let duration = 0;
               if (ev.start_time && ev.end_time) {
                  const [sh, sm] = ev.start_time.split(':').map(Number);
                  const [eh, em] = ev.end_time.split(':').map(Number);
                  duration = Math.max(0, (eh * 60 + em) - (sh * 60 + sm)) / 60;
               }

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
               .sort((a, b) => b.hours - a.hours)
               .slice(0, 5);

            // 2. Status Breakdown
            const statusBreakdown = [
               { name: 'Attended', value: checkedInCount },
               { name: 'No-Show', value: Math.max(0, registeredTotal - checkedInCount - cancelledCount) },
               { name: 'Cancelled', value: cancelledCount }
            ];

            // 3. Event Performance Table
            const recentEvents = allData
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

            setData({
               totalHours: Math.round(totalHours * 10) / 10,
               totalVolunteers: uniqueVolunteers.size,
               eventsHosted: events.length,
               turnoutRate: registeredTotal > 0 ? Math.round((checkedInCount / registeredTotal) * 100) : 0,
               repeatVolunteerRate,
               monthlyGrowth,
               statusBreakdown,
               topVolunteers,
               recentEvents
            });

         } catch (err) {
            console.error("Failed to calculate analytics:", err)
         } finally {
            setLoading(false)
         }
      }
      fetchData()
   }, [])

   // Navbar Helper
   const isActive = (path: string) =>
      pathname === path ? "text-[#0066cc] font-medium" : "text-[#1d1d1f] hover:text-[#0066cc]"

   // Helper for displaying profile image/initials
   const displayImage = profile?.logo_url || profile?.avatar_url
   const displayName = profile?.name || profile?.full_name || "Org"
   const displayInitial = displayName.charAt(0)

   if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>

   return (
      <div className="min-h-screen bg-gray-50 pb-20">

         {/* 1. Header Section */}
         <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-5 md:py-6">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                  <div className="flex items-start md:items-center gap-3 md:gap-4">
                     <Link href="/org-home" className="p-1.5 md:p-2 hover:bg-gray-100 rounded-full transition-colors mt-1 md:mt-0 shrink-0">
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                     </Link>
                     <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">Organization Command Center</h1>
                        <p className="text-xs md:text-sm text-gray-500 mt-1">Real-time performance metrics and impact reporting.</p>
                     </div>
                  </div>
                  {/* Action Buttons - Stacked horizontally on mobile with flex-1 */}
                  <div className="flex gap-2 md:gap-3 pl-11 md:pl-0">
                     <button className="flex-1 md:flex-none justify-center px-3 md:px-4 py-2 md:py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg text-xs md:text-sm flex items-center gap-1.5 hover:bg-gray-50">
                        <Filter className="w-3.5 h-3.5 md:w-4 md:h-4" /> Filter
                     </button>
                     <button className="flex-1 md:flex-none justify-center px-3 md:px-4 py-2 md:py-2 bg-gray-900 text-white font-medium rounded-lg text-xs md:text-sm flex items-center gap-1.5 hover:bg-black shadow-sm">
                        <Download className="w-3.5 h-3.5 md:w-4 md:h-4" /> Export
                     </button>
                  </div>
               </div>
            </div>
         </div>

         <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8">

            {/* 2. ROI & High-Level KPI Cards - Changed to 2x2 grid on mobile */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
               {/* Total Hours */}
               <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-3 md:mb-4">
                     <div className="p-1.5 md:p-2 bg-blue-50 rounded-lg"><Clock className="w-4 h-4 md:w-5 md:h-5 text-blue-600" /></div>
                     {data.totalHours > 0 && <span className="flex items-center text-[10px] md:text-xs font-medium text-green-600 bg-green-50 px-1.5 md:px-2 py-0.5 rounded-full"><ArrowUpRight className="w-2.5 h-2.5 md:w-3 md:h-3 mr-0.5 md:mr-1" />Live</span>}
                  </div>
                  <div>
                     <p className="text-2xl md:text-3xl font-bold text-gray-900">{data.totalHours.toLocaleString()}</p>
                     <p className="text-[11px] md:text-sm text-gray-500 mt-0.5 md:mt-1 leading-tight">Total Impact Hours</p>
                  </div>
               </div>

               {/* Repeat Volunteer Rate */}
               <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-3 md:mb-4">
                     <div className="p-1.5 md:p-2 bg-violet-50 rounded-lg"><Repeat className="w-4 h-4 md:w-5 md:h-5 text-violet-600" /></div>
                  </div>
                  <div>
                     <p className="text-2xl md:text-3xl font-bold text-gray-900">{data.repeatVolunteerRate}%</p>
                     <p className="text-[11px] md:text-sm text-gray-500 mt-0.5 md:mt-1 leading-tight">Repeat Volunteer Rate</p>
                     <p className="text-[10px] md:text-[11px] text-gray-400 mt-0.5 leading-tight">Came back for 2+ events</p>
                  </div>
               </div>

               {/* Unique Volunteers */}
               <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-3 md:mb-4">
                     <div className="p-1.5 md:p-2 bg-purple-50 rounded-lg"><Users className="w-4 h-4 md:w-5 md:h-5 text-purple-600" /></div>
                  </div>
                  <div>
                     <p className="text-2xl md:text-3xl font-bold text-gray-900">{data.totalVolunteers}</p>
                     <p className="text-[11px] md:text-sm text-gray-500 mt-0.5 md:mt-1 leading-tight">Unique Volunteers</p>
                  </div>
               </div>

               {/* Reliability Score */}
               <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-3 md:mb-4">
                     <div className="p-1.5 md:p-2 bg-orange-50 rounded-lg"><CalendarCheck className="w-4 h-4 md:w-5 md:h-5 text-orange-600" /></div>
                  </div>
                  <div>
                     <p className="text-2xl md:text-3xl font-bold text-gray-900">{data.turnoutRate}%</p>
                     <p className="text-[11px] md:text-sm text-gray-500 mt-0.5 md:mt-1 leading-tight">Turnout Reliability</p>
                  </div>
               </div>
            </div>

            {/* 3. Deep Dive Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

               {/* Left: Impact Growth (Area Chart) */}
               <div className="md:col-span-2 bg-white p-4 md:p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                     <h3 className="text-sm md:text-base font-bold text-gray-900">Impact Growth</h3>
                     <span className="text-[10px] md:text-xs text-gray-400">Last 6 Months</span>
                  </div>
                  <div className="h-56 md:h-72">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.monthlyGrowth}>
                           <defs>
                              <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                 <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                              </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                           {/* FIXED: Removed md:fontSize, set standard fontSize={11} */}
                           <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} stroke="#9ca3af" />
                           <YAxis axisLine={false} tickLine={false} fontSize={11} stroke="#9ca3af" width={30} />
                           <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                           <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               {/* Right: Reliability Breakdown (Pie Chart) */}
               <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="text-sm md:text-base font-bold text-gray-900 mb-1 md:mb-2">Volunteer Reliability</h3>
                  <p className="text-[10px] md:text-xs text-gray-400 mb-4 md:mb-6">Based on check-in vs registration data</p>
                  <div className="h-40 md:h-48">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                           <Pie data={data.statusBreakdown} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                              {data.statusBreakdown.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                           </Pie>
                           <Tooltip contentStyle={{ fontSize: '12px' }} />
                        </PieChart>
                     </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center flex-wrap gap-3 md:gap-4 mt-4">
                     {data.statusBreakdown.map((item, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                           <span className="text-[11px] md:text-xs text-gray-600">{item.name}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* 4. Bottom Row: Leaderboard & Recent Events */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

               {/* Top Volunteers Leaderboard */}
               <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-100 flex justify-between items-center">
                     <h3 className="text-sm md:text-base font-bold text-gray-900">Star Volunteers</h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                     {data.topVolunteers.length > 0 ? (
                        data.topVolunteers.map((vol, i) => (
                           <div key={i} className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center font-bold text-blue-600 text-xs md:text-sm shrink-0">
                                    {vol.name.charAt(0)}
                                 </div>
                                 <div className="min-w-0">
                                    <p className="text-xs md:text-sm font-semibold text-gray-900 truncate">{vol.name}</p>
                                    <p className="text-[10px] md:text-xs text-gray-500 truncate">{vol.role}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-2 pl-2">
                                 <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-md text-[10px] md:text-xs font-bold border border-amber-100 flex items-center gap-1 shrink-0">
                                    <Award className="w-3 h-3 hidden sm:block" /> {Math.round(vol.hours)} hrs
                                 </span>
                              </div>
                           </div>
                        ))
                     ) : (
                        <div className="p-6 text-center text-xs md:text-sm text-gray-500 italic">
                           No volunteer data available yet.
                        </div>
                     )}
                  </div>
               </div>

               {/* Recent Event Performance */}
               <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-100">
                     <h3 className="text-sm md:text-base font-bold text-gray-900">Event Performance Matrix</h3>
                  </div>
                  <div className="overflow-x-auto scrollbar-hide">
                     <table className="w-full text-xs md:text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium whitespace-nowrap">
                           <tr>
                              <th className="px-4 md:px-6 py-3">Event Name</th>
                              <th className="px-4 md:px-6 py-3">Date</th>
                              <th className="px-4 md:px-6 py-3 text-right">Turnout</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                           {data.recentEvents.map((ev, i) => (
                              <tr key={i} className="hover:bg-gray-50">
                                 <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-gray-900 max-w-[120px] md:max-w-none truncate">{ev.title}</td>
                                 <td className="px-4 md:px-6 py-3 md:py-4 text-gray-500 whitespace-nowrap">{new Date(ev.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</td>
                                 <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] md:text-xs font-medium ${ev.success >= 90 ? 'bg-green-100 text-green-700' :
                                       ev.success >= 70 ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                                       }`}>
                                       {ev.success || 0}%
                                    </span>
                                 </td>
                              </tr>
                           ))}
                           {data.recentEvents.length === 0 && (
                              <tr>
                                 <td colSpan={3} className="px-6 py-8 text-center text-gray-400 italic text-xs md:text-sm">No recent events found.</td>
                              </tr>
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>

            </div>

         </div>
      </div>
   )
}