"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import {
  Loader2,
  Award,
  Clock,
  Heart,
  CheckCircle2,
  Zap,
  Share2,
} from "lucide-react"
import {
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { formatLabel, eventHours, formatHoursTotal } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { ScrollReveal } from "@/components/ui/scroll-reveal"

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function VolunteerImpactPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  // ✅ Added for Navbar
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

           const duration = eventHours(ev.start_time, ev.end_time);

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

  if (loading) return <div className="h-screen flex items-center justify-center bg-neutral-50 dark:bg-black"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>

  const level = Math.floor(stats.impactScore / 100) + 1;
  const nextLevel = level * 100;
  const progress = (stats.impactScore % 100);
  const ringCircumference = 2 * Math.PI * 70;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black pb-20 font-sans relative overflow-x-hidden">
      {/* Ambient top glow — site-wide convention */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[760px] h-[420px] bg-gradient-to-b from-indigo-200/20 dark:from-indigo-500/[0.14] to-transparent blur-3xl z-0" />

      {/* 1. HERO — Apple Watch-style activity ring instead of a flat bar.
          Intentionally always-dark navy band, independent of site theme
          (same convention as the CTA/footer bands elsewhere). */}
      <div className="bg-[#0F172A] text-white pt-6 pb-16 md:pb-20 px-6 relative overflow-hidden z-10">
         {/* Floating ornaments — plain gradient glows, no icon watermark */}
         <div className="absolute w-96 h-96 rounded-full bg-blue-500/20 blur-3xl -top-32 -right-20 pointer-events-none" />
         <div className="absolute w-72 h-72 rounded-full bg-slate-300/10 blur-3xl bottom-0 left-1/4 pointer-events-none" />

         <div className="max-w-5xl mx-auto relative z-10 pt-4">
            <ScrollReveal className="flex justify-between items-start">
               <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">My Impact Report</h1>
                  <p className="text-blue-200">Member since {new Date(stats.joinDate).getFullYear()}</p>
               </div>
               <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 hover:scale-[1.03] active:scale-95 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-out backdrop-blur-md border border-white/10 shrink-0">
                 <Share2 className="w-4 h-4" /> <span className="hidden sm:inline">Share Impact</span>
               </button>
            </ScrollReveal>

            {/* Activity ring — the hero focal point */}
            <ScrollReveal delay={0.1} className="mt-8 md:mt-10 flex flex-col md:flex-row items-center md:items-end gap-8 md:gap-12">
               <div className="relative w-44 h-44 md:w-52 md:h-52 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                     <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
                     <circle
                        cx="80" cy="80" r="70" fill="none" stroke="url(#ringGradient)" strokeWidth="14" strokeLinecap="round"
                        strokeDasharray={`${(progress / 100) * ringCircumference} ${ringCircumference}`}
                        className="transition-all duration-1000 ease-out"
                     />
                     <defs>
                        <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                           <stop offset="0%" stopColor="#e2e8f0" />
                           <stop offset="100%" stopColor="#60a5fa" />
                        </linearGradient>
                     </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <span className="text-4xl md:text-5xl font-bold">{stats.impactScore}</span>
                     <span className="text-[11px] md:text-xs text-blue-200/70 uppercase tracking-wide mt-1">Impact Score</span>
                  </div>
               </div>

               <div className="text-center md:text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/15 border border-blue-400/20 rounded-full mb-3">
                     <Zap className="w-3.5 h-3.5 text-blue-300 fill-current" />
                     <span className="text-blue-300 text-sm font-semibold">Level {level} Changemaker</span>
                  </div>
                  <p className="text-blue-200/70 text-sm">
                     {100 - progress} XP to Level {level + 1}
                  </p>
                  <p className="text-2xl md:text-3xl font-bold mt-2">{stats.impactScore} <span className="text-blue-200/50 text-lg font-medium">/ {nextLevel} XP</span></p>
               </div>
            </ScrollReveal>
         </div>
      </div>

      {/* 2. MAIN CONTENT - Overlapping the Header */}
      <div className="max-w-5xl mx-auto px-4 -mt-10 relative z-20 space-y-6">

        {/* KEY STATS BENTO — Verified Hours as the secondary hero (wide cell),
            Committed + Lives Touched as supporting cells. */}
        <ScrollReveal className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 flex flex-col justify-between relative overflow-hidden min-h-[140px]">
             <div className="absolute w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl -bottom-8 -left-8 pointer-events-none" />
             <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm uppercase tracking-wide relative"><CheckCircle2 className="w-4 h-4" /> Verified Hours</div>
             <div className="relative">
                <span className="text-5xl font-bold text-foreground">{formatHoursTotal(stats.verifiedHours)}</span>
                <span className="text-sm text-muted-foreground ml-1">hrs contributed</span>
             </div>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card className="p-6 flex flex-col justify-between min-h-[140px]">
               <div className="flex items-center gap-2 text-orange-500 dark:text-orange-400 font-semibold text-sm uppercase tracking-wide"><Clock className="w-4 h-4" /> Committed</div>
               <div>
                  <span className="text-3xl md:text-4xl font-bold text-foreground">{formatHoursTotal(stats.pendingHours)}</span>
                  <span className="text-sm text-muted-foreground ml-1 block md:inline">hrs pending</span>
               </div>
            </Card>

            <Card className="p-6 flex flex-col justify-between min-h-[140px]">
               <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-sm uppercase tracking-wide"><Heart className="w-4 h-4" /> Events</div>
               <div>
                  <span className="text-3xl md:text-4xl font-bold text-foreground">{stats.totalEvents}</span>
                  <span className="text-sm text-muted-foreground ml-1 block md:inline">attended</span>
               </div>
            </Card>
          </div>
        </ScrollReveal>

        {/* DETAILED ANALYSIS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

           {/* LEFT COL: SKILLS */}
           <ScrollReveal delay={0.1} className="space-y-6">
              <Card className="p-6">
                 <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-purple-500" /> Skills Acquired</h3>
                 {stats.skills.length > 0 ? (
                   <div className="flex flex-wrap gap-2">
                     {stats.skills.map((skill, i) => (
                       <span key={i} className="px-3 py-1 bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 rounded-lg text-xs font-semibold border border-purple-100 dark:border-purple-500/20 hover:scale-105 transition-transform duration-300">
                         {skill}
                       </span>
                     ))}
                   </div>
                 ) : (
                   <p className="text-sm text-muted-foreground italic">Complete events to unlock skills.</p>
                 )}
              </Card>
           </ScrollReveal>

           {/* MIDDLE COL: CHARTS */}
           <ScrollReveal delay={0.15} className="md:col-span-2 space-y-6">

              {/* ACTIVITY CHART */}
              <Card className="p-6">
                 <h3 className="font-bold text-foreground mb-6">Activity (Last 6 Months)</h3>
                 <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={stats.monthlyActivity}>
                       <defs>
                         <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                           <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                         </linearGradient>
                       </defs>
                       <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                       <Tooltip
                         cursor={{ fill: 'var(--muted)' }}
                         contentStyle={{
                           borderRadius: '12px', border: '1px solid var(--border)',
                           boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                           backgroundColor: 'var(--card)', color: 'var(--foreground)',
                         }}
                         itemStyle={{ color: 'var(--foreground)' }}
                         labelStyle={{ color: 'var(--foreground)' }}
                       />
                       <Bar dataKey="hours" fill="url(#barGradient)" radius={[6, 6, 6, 6]} barSize={32} />
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
              </Card>

              {/* CAUSES BREAKDOWN — donut + legend, so the colors actually
                  mean something instead of being a bare unlabeled ring. */}
              <Card className="p-6">
                 <h3 className="font-bold text-foreground mb-4">Top Causes</h3>
                 {stats.causesBreakdown.length > 0 ? (
                   <div className="flex flex-col sm:flex-row items-center gap-6">
                     <div className="w-40 h-40 shrink-0 relative">
                       <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie data={stats.causesBreakdown} innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value" stroke="none">
                             {stats.causesBreakdown.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                             ))}
                           </Pie>
                           <Tooltip
                             contentStyle={{
                               borderRadius: '12px', border: '1px solid var(--border)',
                               boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                               backgroundColor: 'var(--card)', color: 'var(--foreground)',
                             }}
                             itemStyle={{ color: 'var(--foreground)' }}
                             labelStyle={{ color: 'var(--foreground)' }}
                             formatter={(value: any, name: any) => [value, formatLabel(String(name))]}
                           />
                         </PieChart>
                       </ResponsiveContainer>
                       <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                         <span className="text-2xl font-bold text-foreground">{stats.causesBreakdown.length}</span>
                         <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Causes</span>
                       </div>
                     </div>
                     <div className="flex-1 w-full space-y-2">
                       {stats.causesBreakdown.map((entry, index) => (
                         <div key={entry.name} className="flex items-center justify-between text-sm hover:bg-black/[0.02] dark:hover:bg-white/[0.03] rounded-lg px-2 py-1.5 -mx-2 transition-colors">
                           <div className="flex items-center gap-2 min-w-0">
                             <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                             <span className="text-foreground truncate">{formatLabel(entry.name)}</span>
                           </div>
                           <span className="text-muted-foreground font-medium shrink-0 ml-2">{entry.value}</span>
                         </div>
                       ))}
                     </div>
                   </div>
                 ) : (
                   <div className="h-40 flex items-center justify-center">
                     <p className="text-sm text-muted-foreground italic">Complete events to see your top causes.</p>
                   </div>
                 )}
              </Card>
           </ScrollReveal>
        </div>

      </div>
    </div>
  )
}
