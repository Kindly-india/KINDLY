"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Search,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Clock,
  User
} from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api" // ✅ Import API

// --- MOCK IMPACT STORIES (Static Content) ---
const IMPACT_STORIES = [
  {
    id: 1,
    title: "Nashik's River Clean-up Drive Removes 500kg of Waste",
    excerpt: "Over 200 volunteers gathered at the Godavari banks this Sunday, proving that collective action can restore our natural lifelines.",
    category: "Environment",
    image: "https://images.unsplash.com/photo-1618477461853-5f8dd68aa1fd?w=800&auto=format&fit=crop&q=60",
    readTime: "3 min read",
    date: "2 days ago",
    author: "Green Earth NGO"
  },
  {
    id: 2,
    title: "The Zero-Hunger Initiative: Join the Movement",
    excerpt: "How a small group of students started redistributing surplus wedding food to shelters across the city.",
    category: "Community",
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&auto=format&fit=crop&q=60",
    readTime: "5 min read",
    date: "1 week ago",
    author: "Robin Hood Army"
  },
  {
    id: 3,
    title: "Teaching the Future: Weekend Classes for Slum Kids",
    excerpt: "Education is the most powerful weapon. See how these volunteers are arming the next generation with knowledge.",
    category: "Education",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=60",
    readTime: "4 min read",
    date: "Just now",
    author: "Teach For India"
  },
  {
    id: 4,
    title: "Blood Donation Camp Saves 50 Lives in One Day",
    excerpt: "A record-breaking turnout at the Civil Hospital drive shows the spirit of giving is alive and well.",
    category: "Health",
    image: "https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=800&auto=format&fit=crop&q=60",
    readTime: "2 min read",
    date: "3 days ago",
    author: "Red Cross"
  },
  {
    id: 5,
    title: "Old Age Home Visit: Stories from the Past",
    excerpt: "Sometimes, all you need to give is your time. Volunteers spent the day listening to stories that history books forgot.",
    category: "Elderly Care",
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&auto=format&fit=crop&q=60",
    readTime: "6 min read",
    date: "5 days ago",
    author: "Happy Hearts Foundation"
  },
  {
    id: 6,
    title: "Stray Dog Adoption Drive: A Furry Success",
    excerpt: "15 pups found their forever homes this weekend. Here are the heartwarming moments from the event.",
    category: "Animals",
    image: "https://images.unsplash.com/photo-1551730459-92db2a308d6a?w=800&auto=format&fit=crop&q=60",
    readTime: "3 min read",
    date: "1 day ago",
    author: "Paws & Tails"
  }
]

export default function SocialDiscoveryPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<'all' | 'volunteers' | 'orgs'>('all')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([]) 
  const [isSearching, setIsSearching] = useState(false)

  // --- HANDLERS ---
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setLoading(true)
    setResults([]) // Clear previous results
    
    try {
      // ✅ REAL API CALL: Fetch Global Search Results
      const data = await api.globalSearch(searchQuery)
      setResults(data)
    } catch (err) {
      console.error("Search failed:", err)
    } finally {
      setLoading(false)
    }
  }

  // ✅ FILTER RESULTS BASED ON ACTIVE TAB
  const displayedResults = results.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'volunteers') return item.type === 'volunteer';
    if (activeTab === 'orgs') return item.type === 'org';
    return true;
  });

  const getCategoryColor = (category: string) => {
    const map: Record<string, string> = {
      Environment: "bg-emerald-100 text-emerald-700",
      Community: "bg-blue-100 text-blue-700",
      Education: "bg-orange-100 text-orange-700",
      Health: "bg-red-100 text-red-700",
      "Elderly Care": "bg-purple-100 text-purple-700",
      Animals: "bg-amber-100 text-amber-700",
    }
    return map[category] || "bg-gray-100 text-gray-700"
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-20">
      
      {/* --- HEADER & SEARCH --- */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-4">
          <form onSubmit={handleSearch} className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
            <input 
              type="text" 
              placeholder="Search volunteers, organizations..." 
              value={searchQuery}
              onChange={(e) => {
                  setSearchQuery(e.target.value)
                  if(e.target.value === '') { setIsSearching(false); setResults([]); }
              }}
              className="w-full h-12 pl-12 pr-4 bg-[#f5f5f7] rounded-full text-[15px] outline-none border border-transparent focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all placeholder:text-gray-500"
            />
          </form>

          {/* Filters (Only visible when searching) */}
          {isSearching && (
            <div className="flex gap-2 mt-3 animate-in fade-in slide-in-from-top-2">
              {['all', 'volunteers', 'orgs'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all",
                    activeTab === tab 
                      ? "bg-black text-white shadow-md" 
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {tab === 'orgs' ? 'Organizations' : tab}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* LOADING STATE */}
        {loading && (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p className="text-sm">Searching community...</p>
            </div>
        )}

        {/* SEARCH RESULTS */}
        {!loading && isSearching && displayedResults.length > 0 && (
            <div className="space-y-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Top Results</h3>
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  {displayedResults.map((item, idx) => (
                      <Link 
                          key={idx} 
                          href={item.type === 'volunteer' ? `/volunteer-profile/${item.id}` : `/org-profile/${item.id}`}
                          className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                      >
                          <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center">
                              {item.image ? (
                                <img src={item.image} className="w-full h-full object-cover" /> 
                              ) : (
                                <User className="w-5 h-5 text-gray-400" />
                              )}
                          </div>
                          <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                  <h4 className="font-semibold text-gray-900 truncate text-[15px]">{item.name}</h4>
                                  {item.verified && <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-50" />}
                              </div>
                              <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-gray-300" />
                      </Link>
                  ))}
                </div>
            </div>
        )}

        {/* NO RESULTS STATE */}
        {!loading && isSearching && displayedResults.length === 0 && (
           <div className="text-center py-12 text-gray-500">
             <p>No results found for "{searchQuery}"</p>
           </div>
        )}

        {/* DEFAULT FEED: IMPACT STORIES */}
        {!isSearching && !loading && (
            <div className="space-y-8 animate-in fade-in duration-500">
                
                <div className="flex items-center justify-between px-1">
                    <h1 className="text-2xl font-bold text-[#1d1d1f] tracking-tight">Discover Impact</h1>
                    <span className="text-xs font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {IMPACT_STORIES.map((story) => (
                        <div key={story.id} className="group cursor-pointer flex flex-col h-full bg-white rounded-3xl border border-gray-200/60 overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300">
                            
                            {/* Card Image */}
                            <div className="aspect-[4/3] w-full overflow-hidden relative">
                                <img 
                                  src={story.image} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                />
                                <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent opacity-60" />
                                <span className={cn("absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm", getCategoryColor(story.category))}>
                                    {story.category}
                                </span>
                            </div>

                            {/* Card Content */}
                            <div className="p-5 flex flex-col flex-1">
                                <div className="flex items-center gap-2 text-[11px] font-medium text-gray-400 mb-3">
                                    <span>{story.author}</span>
                                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                                    <span>{story.date}</span>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 leading-snug mb-3 group-hover:text-[#0066cc] transition-colors">
                                    {story.title}
                                </h3>
                                
                                <p className="text-sm text-gray-600 line-clamp-3 mb-4 leading-relaxed">
                                    {story.excerpt}
                                </p>

                                <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                        <Clock className="w-3.5 h-3.5" />
                                        {story.readTime}
                                    </div>
                                    <span className="text-xs font-bold text-[#1d1d1f] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                        Read Story <ChevronRight className="w-3 h-3" />
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="py-8 text-center">
                    <button className="text-sm font-medium text-gray-500 hover:text-black transition-colors border-b border-transparent hover:border-black pb-0.5">
                        Load more stories
                    </button>
                </div>

            </div>
        )}

      </div>
    </div>
  )
}