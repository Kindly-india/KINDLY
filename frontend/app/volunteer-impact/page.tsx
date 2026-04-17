"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import Link from "next/link"
import Image from "next/image" // ✅ Added
import { 
  Loader2, 
  TrendingUp, 
  Award, 
  Clock, 
  Heart, 
  CheckCircle2, 
  Zap, 
  Globe, 
  Download, 
  Share2, 
  ArrowLeft,
  Menu, // ✅ Added
  X,    // ✅ Added
  Sparkles // ✅ Added
} from "lucide-react"
import { 
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from "recharts"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function VolunteerImpactPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  
  // ✅ Added for Navbar
  const [menuOpen, setMenuOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)

  const [stats, setStats] = useState({
    verifiedHours: 0,
    pendingHours: 0,
    totalEvents: 0,
    impactScore: 0,
    skills: [] as string[],
    sdgs: [] as string[],
    monthlyActivity: [] as any[],
    causesBreakdown: [] as any[],
    joinDate: new Date().toISOString()
  })

useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Authenticate with Supabase
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        // 2. Redirect to login if unauthorized
        if (!user || authError) {
          router.push('/login')
          return // Stop execution
        }

        // 3. Proceed with your existing data fetching
        // ✅ Fetch Profile & Registrations together
        const [profileRes, res] = await Promise.all([
            api.getUserProfile().catch(() => null),
            api.getMyRegistrations()
        ]);

        if (profileRes?.profile) {
            setProfile(profileRes.profile)
        }

        const events = res.events || []; 

        let verified = 0;
        let pending = 0;
        let attended = 0;
        const skillsSet = new Set<string>();
        const sdgSet = new Set<string>();
        const causesMap = new Map();
        
        const activityMap = new Array(6).fill(0).map((_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - (5 - i));
            return { 
                name: d.toLocaleString('default', { month: 'short' }), 
                monthIdx: d.getMonth(),
                hours: 0 
            };
        });

        events.forEach((ev: any) => {
           const status = (ev.registration_status || ev.status || '').toLowerCase();
           const isVerified = status === 'completed' || status === 'checked_in';
           const isRegistered = status === 'registered';

           let duration = ev.hours_contributed || 0;
           if (!duration && ev.start_time && ev.end_time) {
              const [sh, sm] = ev.start_time.split(':').map(Number);
              const [eh, em] = ev.end_time.split(':').map(Number);
              duration = Math.max(0, (eh * 60 + em) - (sh * 60 + sm)) / 60;
           }

           if (isVerified) {
             verified += duration;
             attended++;
             const evDate = new Date(ev.event_date);
             const evMonth = evDate.getMonth();
             const monthEntry = activityMap.find(m => m.monthIdx === evMonth);
             if (monthEntry) monthEntry.hours += duration;
           } else if (isRegistered) {
             pending += duration;
           }

           const cat = (ev.category || 'General').toLowerCase();
           const displayCat = cat.charAt(0).toUpperCase() + cat.slice(1);
           causesMap.set(displayCat, (causesMap.get(displayCat) || 0) + 1);

           if (cat.includes('education') || cat.includes('mentor') || cat.includes('teach')) { skillsSet.add('Mentoring'); skillsSet.add('Public Speaking'); sdgSet.add('SDG 4: Quality Education'); }
           if (cat.includes('nature') || cat.includes('outdoor') || cat.includes('clean')) { skillsSet.add('Eco-Awareness'); skillsSet.add('Teamwork'); sdgSet.add('SDG 13: Climate Action'); }
           if (cat.includes('health') || cat.includes('medical')) { skillsSet.add('First Aid'); skillsSet.add('Caregiving'); sdgSet.add('SDG 3: Good Health'); }
           if (cat.includes('animal') || cat.includes('welfare')) { skillsSet.add('Animal Care'); sdgSet.add('Empathy'); }
           if (cat.includes('civic') || cat.includes('community') || cat.includes('food') || cat.includes('donation')) { skillsSet.add('Community Service'); sdgSet.add('SDG 11: Sustainable Cities'); }
           if (cat.includes('elderly') || cat.includes('elder')) { skillsSet.add('Caregiving'); sdgSet.add('SDG 3: Good Health'); }
           if (cat.includes('women') || cat.includes('empowerment')) { skillsSet.add('Advocacy'); sdgSet.add('SDG 5: Gender Equality'); }
           if (cat.includes('mental') || cat.includes('wellness')) { skillsSet.add('Empathy'); sdgSet.add('SDG 3: Good Health'); }
           if (cat.includes('youth') || cat.includes('sports')) { skillsSet.add('Coaching'); sdgSet.add('SDG 3: Good Health'); }
           if (cat.includes('art') || cat.includes('culture')) { skillsSet.add('Creativity'); sdgSet.add('SDG 11: Sustainable Cities'); }
        });

        setStats({
            verifiedHours: Math.round(verified * 10) / 10,
            pendingHours: Math.round(pending * 10) / 10,
            totalEvents: attended,
            impactScore: Math.round((verified * 10) + (attended * 50)),
            skills: Array.from(skillsSet),
            sdgs: Array.from(sdgSet),
            monthlyActivity: activityMap,
            causesBreakdown: Array.from(causesMap, ([name, value]) => ({ name, value })),
            joinDate: new Date().toISOString()
        });

      } catch (err) {
        console.error("Impact Load Error:", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [router]) // Added router as a dependency

  // ✅ Profile Display Logic
  const displayImage = profile?.avatar_url || profile?.logo_url
  const displayName = profile?.full_name || profile?.name || "User"
  const displayInitial = displayName ? displayName.charAt(0).toUpperCase() : "U"

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>

  const level = Math.floor(stats.impactScore / 100) + 1;
  const nextLevel = level * 100;
  const progress = (stats.impactScore % 100);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20 font-sans">


      {/* 1. HERO HEADER */}
      <div className="bg-[#0F172A] text-white pt-6 pb-24 px-6 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-12 opacity-10">
            <Globe className="w-64 h-64" />
         </div>
         <div className="max-w-5xl mx-auto relative z-10 pt-4">
            <div className="flex justify-between items-start">
               <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">My Impact Report</h1>
                  <p className="text-blue-200">Member since {new Date(stats.joinDate).getFullYear()}</p>
               </div>
               <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-sm font-medium transition-all backdrop-blur-md">
                 <Share2 className="w-4 h-4" /> Share Impact
               </button>
            </div>

            {/* Level Progress */}
            <div className="mt-8 max-w-md">
               <div className="flex justify-between text-sm mb-2 font-medium">
                  <span className="text-emerald-400">Level {level} Changemaker</span>
                  <span className="text-gray-400">{stats.impactScore} / {nextLevel} XP</span>
               </div>
               <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{width: `${progress}%`}} />
               </div>
            </div>
         </div>
      </div>

      {/* 2. MAIN CONTENT - Overlapping the Header */}
      <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-20 space-y-6">
        
        {/* KEY STATS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
             <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm uppercase tracking-wide"><CheckCircle2 className="w-4 h-4" /> Verified Hours</div>
             <div>
                <span className="text-4xl font-bold text-gray-900">{stats.verifiedHours}</span>
                <span className="text-sm text-gray-400 ml-1">hrs</span>
             </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
             <div className="flex items-center gap-2 text-orange-500 font-semibold text-sm uppercase tracking-wide"><Clock className="w-4 h-4" /> Committed</div>
             <div>
                <span className="text-4xl font-bold text-gray-900">{stats.pendingHours}</span>
                <span className="text-sm text-gray-400 ml-1">hrs pending</span>
             </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
             <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm uppercase tracking-wide"><Heart className="w-4 h-4" /> Lives Touched</div>
             <div>
                <span className="text-4xl font-bold text-gray-900">{stats.totalEvents}</span>
                <span className="text-sm text-gray-400 ml-1">events</span>
             </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl shadow-lg shadow-emerald-200 text-white flex flex-col justify-between h-32">
             <div className="flex items-center gap-2 font-semibold text-sm uppercase tracking-wide opacity-90"><Zap className="w-4 h-4" /> Impact Score</div>
             <div className="text-4xl font-bold">{stats.impactScore}</div>
          </div>
        </div>

        {/* DETAILED ANALYSIS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           
           {/* LEFT COL: SKILLS & SDGs */}
           <div className="space-y-6">
              {/* SKILLS */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                 <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-purple-500" /> Skills Acquired</h3>
                 {stats.skills.length > 0 ? (
                   <div className="flex flex-wrap gap-2">
                     {stats.skills.map((skill, i) => (
                       <span key={i} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-semibold border border-purple-100">
                         {skill}
                       </span>
                     ))}
                   </div>
                 ) : (
                   <p className="text-sm text-gray-400 italic">Complete events to unlock skills.</p>
                 )}
              </div>

              {/* SDGs */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                 <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-blue-500" /> UN SDGs Supported</h3>
                 {stats.sdgs.length > 0 ? (
                   <div className="space-y-2">
                     {stats.sdgs.map((sdg, i) => (
                       <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                         <div className="w-2 h-2 rounded-full bg-blue-500" /> {sdg}
                       </div>
                     ))}
                   </div>
                 ) : (
                   <p className="text-sm text-gray-400 italic">No specific SDG data yet.</p>
                 )}
              </div>
           </div>

           {/* MIDDLE COL: CHARTS */}
           <div className="md:col-span-2 space-y-6">
              
              {/* ACTIVITY CHART */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                 <h3 className="font-bold text-gray-900 mb-6">Activity (Last 6 Months)</h3>
                 <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={stats.monthlyActivity}>
                       <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                       <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                       <Bar dataKey="hours" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
              </div>

              {/* CAUSES BREAKDOWN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-4">Top Causes</h3>
                    <div className="h-48 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          {stats.causesBreakdown.length > 0 ? (
                              <Pie data={stats.causesBreakdown} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                {stats.causesBreakdown.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                          ) : (
                              <Pie data={[{ name: 'None', value: 1 }]} innerRadius={50} outerRadius={70} dataKey="value">
                                  <Cell fill="#f3f4f6" />
                              </Pie>
                          )}
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                 </div>

                 <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                       <Award className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-gray-900">Certificate Ready</h3>
                    <p className="text-xs text-gray-500 mt-1 mb-4">You have pending certificates for your verified hours.</p>
                    <button className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-full flex items-center gap-2 hover:bg-black transition-colors">
                       <Download className="w-3.5 h-3.5" /> Download
                    </button>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  )
}