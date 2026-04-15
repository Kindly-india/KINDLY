"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Heart, Sparkles, Users, Star, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"

export function LoginPage() {
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()

    return (
        // Mobile: Solid white background. Desktop: Gradient background.
        <div className="min-h-screen bg-white md:bg-gradient-to-b md:from-[#fef7f0] md:via-white md:to-[#f0fdf4] flex flex-col overflow-x-hidden">
            
            <header className="pt-6 md:pt-12 pb-3 md:pb-6 px-4 md:px-8 flex items-center justify-between relative z-20">
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors p-2 -ml-2"
                >
                    <ChevronLeft className="w-5 h-5" />
                    <span className="hidden md:inline">Back</span>
                </button>

                <div className="absolute left-1/2 -translate-x-1/2">
                    <img
                        src="/logo.png"
                        alt="Kindly Logo"
                        className="h-5 md:h-6 object-contain"
                    />
                </div>
                
                {/* Spacer to balance the header flexbox */}
                <div className="w-10"></div>
            </header>

            <main className="flex-1 flex items-start md:items-center justify-center px-4 md:px-6 pt-6 md:pt-0 pb-12 md:pb-20 relative">
                
                {/* Decorative floating icons - Hidden entirely on mobile to save space & reduce clutter */}
                <div className="hidden md:flex absolute top-20 left-20 w-14 h-14 rounded-2xl bg-white shadow-lg items-center justify-center z-10">
                    <Heart className="w-7 h-7 text-[#ff6b6b]" />
                </div>
                <div className="hidden md:flex absolute top-32 right-24 w-14 h-14 rounded-2xl bg-white shadow-lg items-center justify-center z-10">
                    <Sparkles className="w-7 h-7 text-[#f59e0b]" />
                </div>
                <div className="hidden md:flex absolute bottom-32 left-32 w-14 h-14 rounded-2xl bg-white shadow-lg items-center justify-center z-10">
                    <Users className="w-7 h-7 text-[#3b82f6]" />
                </div>
                <div className="hidden md:flex absolute bottom-40 right-40 w-14 h-14 rounded-2xl bg-white shadow-lg items-center justify-center z-10">
                    <Star className="w-7 h-7 text-[#10b981]" />
                </div>

                <div className="w-full max-w-[480px] relative">
                    
                    {/* Decorative blur elements - Desktop only */}
                    <div className="hidden md:block absolute -top-10 -left-10 w-20 h-20 bg-gradient-to-br from-[#ffecd2]/40 to-[#fcb69f]/40 rounded-full blur-2xl" />
                    <div className="hidden md:block absolute -bottom-10 -right-10 w-24 h-24 bg-gradient-to-br from-[#a8edea]/40 to-[#fed6e3]/40 rounded-full blur-2xl" />

                    {/* The Card: Flush on mobile (no padding/shadow), floating card on desktop */}
                    <div className="relative bg-white md:bg-white/80 md:backdrop-blur-sm rounded-none md:rounded-3xl p-2 md:p-10 md:shadow-[0_2px_40px_-12px_rgba(0,0,0,0.1)]">
                        
                        <h1 className="text-[28px] md:text-[40px] font-bold text-[#1d1d1f] tracking-tight text-center leading-tight">
                            Welcome Back.
                        </h1>
                        <p className="text-[15px] md:text-[17px] text-[#86868b] text-center mt-2 mb-8 md:mb-10">
                            Sign in to continue making a difference.
                        </p>

                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);

                                try {
                                    await api.login(
                                        formData.get('email') as string,
                                        formData.get('password') as string
                                    );

                                    const profileData = await api.getUserProfile();

                                    if (!profileData) {
                                        throw new Error('Profile not found');
                                    }

                                    if (profileData.userType === 'volunteer') {
                                        window.location.href = '/home';
                                    } else if (profileData.userType === 'organization') {
                                        const approvalStatus = profileData.profile.approval_status;

                                        if (approvalStatus === 'pending') {
                                            alert('Your organization is pending approval. You will be notified once approved.');
                                            await api.logout();
                                            window.location.href = '/';
                                        } else if (approvalStatus === 'approved') {
                                            window.location.href = '/org-home';
                                        } else {
                                            alert('Your organization application was rejected. Please contact support.');
                                            await api.logout();
                                            window.location.href = '/';
                                        }
                                    }
                                } catch (error: any) {
                                    alert(error.message || 'Login failed. Please check your credentials.');
                                }
                            }}
                            className="space-y-4 md:space-y-5"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[11px] md:text-xs text-[#86868b] font-bold uppercase tracking-wider ml-1">
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    required
                                    // CRITICAL: text-[16px] required for mobile iOS zoom fix!
                                    className="h-12 md:h-14 bg-[#f5f5f7] border-0 rounded-xl text-[16px] md:text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] focus-visible:ring-2 focus-visible:ring-[#ff6b6b] px-4"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-[11px] md:text-xs text-[#86868b] font-bold uppercase tracking-wider ml-1">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        required
                                        // CRITICAL: text-[16px] required for mobile iOS zoom fix!
                                        className="h-12 md:h-14 bg-[#f5f5f7] border-0 rounded-xl text-[16px] md:text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] pl-4 pr-12 focus-visible:ring-2 focus-visible:ring-[#ff6b6b]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] transition-colors p-2"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end pt-1">
                                <Link href="#" className="text-[12px] md:text-[13px] font-semibold text-[#ff6b6b] hover:underline">
                                    Forgot your password?
                                </Link>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 md:h-14 bg-gradient-to-r from-[#ff6b6b] to-[#ee5a5a] hover:from-[#ff5252] hover:to-[#e04848] text-white text-[16px] md:text-[17px] font-bold rounded-xl mt-2 shadow-lg shadow-[#ff6b6b]/25 active:scale-[0.98] transition-all"
                            >
                                Sign In
                            </Button>
                        </form>

                        <div className="mt-8 md:mt-10">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-[#e8e8ed]"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="bg-white px-4 text-[#86868b] text-[11px] md:text-[12px] font-bold uppercase tracking-wider">
                                        Or sign in with
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4 mt-6">
                                <button
                                    type="button"
                                    className="h-12 md:h-12 flex-1 rounded-xl bg-white border border-[#e8e8ed] hover:border-[#d2d2d7] hover:shadow-md flex items-center justify-center gap-2 md:gap-3 transition-all active:scale-[0.98]"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    <span className="text-[15px] text-[#1d1d1f] font-bold">Google</span>
                                </button>

                                <button
                                    type="button"
                                    className="h-12 md:h-12 flex-1 rounded-xl bg-white border border-[#e8e8ed] hover:border-[#d2d2d7] hover:shadow-md flex items-center justify-center gap-2 md:gap-3 transition-all active:scale-[0.98]"
                                >
                                    <svg className="w-5 h-5 text-[#1d1d1f]" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                                    </svg>
                                    <span className="text-[15px] text-[#1d1d1f] font-bold">Apple</span>
                                </button>
                            </div>
                        </div>

                        <p className="text-center mt-8 md:mt-10 text-[14px] md:text-[15px] text-[#86868b] pb-4">
                            Don't have an account?{" "}
                            <Link href="/#hero" className="text-[#ff6b6b] hover:underline font-bold">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    )
}