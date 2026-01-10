"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import Link from "next/link"
import { usePathname } from "next/navigation" // ✅ Added for active link detection
import { 
  Loader2, Users, Clock, CalendarCheck, 
  DollarSign, ArrowUpRight, ArrowDownRight, Download, 
  Award, Filter, ArrowLeft,
  Menu, X, Calendar, BarChart3 // ✅ Added Navbar icons
} from "lucide-react"
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from "recharts"

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

export default function OrgAnalyticsPage() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  
  // --- Navbar State ---
  const [menuOpen, setMenuOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)

  // --- Analytics State ---
  const [data, setData] = useState({
    totalHours: 0,
    totalVolunteers: 0,
    eventsHosted: 0,
    turnoutRate: 0,
    economicValue: 0,
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
            economicValue: Math.round(totalHours * 200), // ₹200/hr
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
      
      {/* =========================================================
          ORGANIZATION NAVBAR (Integrated)
         ========================================================= */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#f5f5f7]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-12 md:h-14 flex items-center justify-between">
          <Link href="/org-home" className="flex items-center">
            <span className="text-[15px] md:text-[17px] font-bold text-[#1d1d1f] tracking-tight">KINDLY</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex gap-6">
            <Link href="/org-events" className={`text-[13px] md:text-[15px] transition-colors ${isActive('/org-events')}`}>
              My Events
            </Link>
            <Link href="/social" className={`text-[13px] md:text-[15px] transition-colors ${isActive('/social')}`}>
              Social
            </Link>
            <Link href="/org-analytics" className={`text-[13px] md:text-[15px] transition-colors ${isActive('/org-analytics')}`}>
              Analytics
            </Link>
          </div>

          {/* Desktop Profile Icon */}
          <Link href={`/organizations/${profile?.id}`} className="hidden md:block">
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#f5f5f7] hover:ring-[#0066cc] transition-all bg-gray-100 flex items-center justify-center text-[#0066cc] font-bold">
              {displayImage ? (
                <img src={displayImage} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span>{displayInitial}</span>
              )}
            </div>
          </Link>

          {/* Mobile Menu Button */}
          <div className="relative md:hidden">
            <button 
              onClick={() => setMenuOpen(!menuOpen)} 
              className="w-9 h-9 rounded-full bg-[#f5f5f7] flex items-center justify-center hover:bg-[#e5e5e7] transition-colors"
            >
              {menuOpen ? <X className="w-5 h-5 text-[#1d1d1f]" /> : <Menu className="w-5 h-5 text-[#1d1d1f]" />}
            </button>
            
            {/* Mobile Dropdown */}
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-12 z-50 w-56 bg-white rounded-xl shadow-xl border border-[#e5e5e7] overflow-hidden">
                  <Link href={`/organizations/${profile?.id}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-[#f5f5f7] transition-colors border-b border-[#f5f5f7]">
                    <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-[#f5f5f7] bg-gray-100 flex items-center justify-center">
                       {displayImage ? (
                          <img src={displayImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold">{displayInitial}</span>
                        )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-medium text-[#1d1d1f]">View Profile</span>
                      <span className="text-[10px] text-gray-500 truncate max-w-[120px]">{displayName}</span>
                    </div>
                  </Link>

                  <Link href="/org-events" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-[#f5f5f7] transition-colors border-b border-[#f5f5f7]">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e0f2fe] to-[#bae6fd] flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-[#0284c7]" />
                    </div>
                    <span className="text-[13px] font-medium text-[#1d1d1f]">My Events</span>
                  </Link>
                  <Link href="/org-volunteers" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-[#f5f5f7] transition-colors border-b border-[#f5f5f7]">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9] flex items-center justify-center">
                      <Users className="w-4 h-4 text-[#2e7d32]" />
                    </div>
                    <span className="text-[13px] font-medium text-[#1d1d1f]">Volunteers</span>
                  </Link>
                  <Link href="/org-analytics" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-[#f5f5f7] transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f3e8ff] to-[#d8b4fe] flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-[#9333ea]" />
                    </div>
                    <span className="text-[13px] font-medium text-[#1d1d1f]">Analytics</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* =========================================================
          PAGE CONTENT
         ========================================================= */}
      
      {/* 1. Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <Link href="/org-home" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <ArrowLeft className="w-5 h-5 text-gray-500" />
               </Link>
               <div>
                  <h1 className="text-2xl font-bold text-gray-900">Organization Command Center</h1>
                  <p className="text-sm text-gray-500">Real-time performance metrics and impact reporting.</p>
               </div>
            </div>
            <div className="flex gap-3">
               <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg text-sm flex items-center gap-2 hover:bg-gray-50">
                  <Filter className="w-4 h-4" /> Filter Date
               </button>
               <button className="px-4 py-2 bg-gray-900 text-white font-medium rounded-lg text-sm flex items-center gap-2 hover:bg-black shadow-sm">
                  <Download className="w-4 h-4" /> Export Report
               </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* 2. ROI & High-Level KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           {/* Total Hours */}
           <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="flex justify-between items-start mb-4">
                 <div className="p-2 bg-blue-50 rounded-lg"><Clock className="w-5 h-5 text-blue-600" /></div>
                 {data.totalHours > 0 && <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><ArrowUpRight className="w-3 h-3 mr-1"/>Live</span>}
              </div>
              <p className="text-3xl font-bold text-gray-900">{data.totalHours.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">Total Impact Hours</p>
           </div>

           {/* Economic Value */}
           <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="flex justify-between items-start mb-4">
                 <div className="p-2 bg-emerald-50 rounded-lg"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
                 <span className="text-xs text-gray-400">Est. Value (₹200/hr)</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">₹{(data.economicValue / 1000).toFixed(1)}k</p>
              <p className="text-sm text-gray-500 mt-1">Economic Value Generated</p>
           </div>

           {/* Unique Volunteers */}
           <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="flex justify-between items-start mb-4">
                 <div className="p-2 bg-purple-50 rounded-lg"><Users className="w-5 h-5 text-purple-600" /></div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{data.totalVolunteers}</p>
              <p className="text-sm text-gray-500 mt-1">Unique Volunteers</p>
           </div>

           {/* Reliability Score */}
           <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="flex justify-between items-start mb-4">
                 <div className="p-2 bg-orange-50 rounded-lg"><CalendarCheck className="w-5 h-5 text-orange-600" /></div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{data.turnoutRate}%</p>
              <p className="text-sm text-gray-500 mt-1">Turnout Reliability</p>
           </div>
        </div>

        {/* 3. Deep Dive Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           
           {/* Left: Impact Growth (Area Chart) */}
           <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="font-bold text-gray-900">Impact Growth</h3>
                 <span className="text-xs text-gray-400">Last 6 Months</span>
              </div>
              <div className="h-72">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.monthlyGrowth}>
                       <defs>
                          <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                             <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} stroke="#9ca3af" />
                       <YAxis axisLine={false} tickLine={false} fontSize={12} stroke="#9ca3af" />
                       <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                       <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Right: Reliability Breakdown (Pie Chart) */}
           <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-2">Volunteer Reliability</h3>
              <p className="text-xs text-gray-400 mb-6">Based on check-in vs registration data</p>
              <div className="h-48">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie data={data.statusBreakdown} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {data.statusBreakdown.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                       </Pie>
                       <Tooltip />
                    </PieChart>
                 </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                 {data.statusBreakdown.map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                       <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                       <span className="text-xs text-gray-600">{item.name}</span>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* 4. Bottom Row: Leaderboard & Recent Events */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           
           {/* Top Volunteers Leaderboard */}
           <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                 <h3 className="font-bold text-gray-900">Star Volunteers</h3>
              </div>
              <div className="divide-y divide-gray-50">
                 {data.topVolunteers.length > 0 ? (
                    data.topVolunteers.map((vol, i) => (
                        <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center font-bold text-blue-600 text-sm">
                                {vol.name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">{vol.name}</p>
                                <p className="text-xs text-gray-500">{vol.role}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-md text-xs font-bold border border-amber-100 flex items-center gap-1">
                                <Award className="w-3 h-3" /> {Math.round(vol.hours)} hrs
                            </span>
                        </div>
                        </div>
                    ))
                 ) : (
                    <div className="p-6 text-center text-sm text-gray-500 italic">
                        No volunteer data available yet.
                    </div>
                 )}
              </div>
           </div>

           {/* Recent Event Performance */}
           <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                 <h3 className="font-bold text-gray-900">Event Performance Matrix</h3>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                       <tr>
                          <th className="px-6 py-3">Event Name</th>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3 text-right">Turnout</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {data.recentEvents.map((ev, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                             <td className="px-6 py-4 font-medium text-gray-900">{ev.title}</td>
                             <td className="px-6 py-4 text-gray-500">{new Date(ev.date).toLocaleDateString()}</td>
                             <td className="px-6 py-4 text-right">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                   ev.success >= 90 ? 'bg-green-100 text-green-700' : 
                                   ev.success >= 70 ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                                }`}>
                                   {ev.success || 0}%
                                </span>
                             </td>
                          </tr>
                       ))}
                       {data.recentEvents.length === 0 && (
                           <tr>
                               <td colSpan={3} className="px-6 py-8 text-center text-gray-400 italic">No recent events found.</td>
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