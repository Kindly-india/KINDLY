"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
    Eye, 
    EyeOff, 
    Heart, 
    Sparkles, 
    Users, 
    Star, 
    ChevronLeft, 
    Mail, 
    ArrowLeft, 
    CheckCircle2, 
    AlertCircle, 
    Loader2 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import { supabase } from "@/lib/supabase"
import { BrandSplash } from "@/components/brand-splash"

export function LoginPage() {
    const router = useRouter()
    
    // --- LOGIN STATE ---
    const [showPassword, setShowPassword] = useState(false)
    
    // --- SPLASH STATE ---
    const [showSplash, setShowSplash] = useState(false)
    const [loginDestination, setLoginDestination] = useState("")

    // --- FORGOT PASSWORD STATE ---
    const [isForgotPassword, setIsForgotPassword] = useState(false)
    const [resetEmail, setResetEmail] = useState("")
    const [resetStatus, setResetStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
    const [resetMessage, setResetMessage] = useState("")

    // --- HANDLERS ---
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget as HTMLFormElement)

        try {
            await api.login(
                formData.get('email') as string,
                formData.get('password') as string,
            )

            const profileData = await api.getUserProfile()
            if (!profileData) throw new Error('Profile not found')

            if (profileData.userType === 'volunteer') {
                // Set role cookie so middleware can enforce RBAC
                document.cookie = 'kindly_role=volunteer; path=/; max-age=604800; SameSite=Lax'
                // Route directly to onboarding if not completed — avoids the /home flash
                const destination = profileData.profile?.onboarding_completed === false ? '/onboarding' : '/home'
                setLoginDestination(destination)
                setShowSplash(true)
            } else if (profileData.userType === 'organization') {
                const approvalStatus = profileData.profile.approval_status

                if (approvalStatus === 'pending') {
                    alert('Your organization is pending approval. You will be notified once approved.')
                    await api.logout()
                    window.location.href = '/'
                } else if (approvalStatus === 'approved') {
                    // Set role cookie so middleware can enforce RBAC
                    document.cookie = 'kindly_role=org; path=/; max-age=604800; SameSite=Lax'
                    // Explicit login — show the brand splash before navigating
                    setLoginDestination('/org-home')
                    setShowSplash(true)
                } else {
                    alert('Your organization application was rejected. Please contact support.')
                    await api.logout()
                    window.location.href = '/'
                }
            }
        } catch (error: any) {
            const raw: string = error.message || ''
            const msg = /not confirmed|email.*confirm|confirm.*email|verify.*email|email.*verify/i.test(raw)
                ? 'Please verify your email address to continue.'
                : raw || 'Login failed. Please check your credentials.'
            alert(msg)
        }
    }

    const handleSplashDone = () => {
        window.location.href = loginDestination
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!resetEmail) return
        
        setResetStatus("loading")
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                redirectTo: `${window.location.origin}/update-password`,
            })
            if (error) throw error
            setResetStatus("success")
            setResetMessage("Check your inbox! We've sent a secure link to reset your password.")
        } catch (err: any) {
            setResetStatus("error")
            setResetMessage(err.message || "Failed to send reset link. Please check the email and try again.")
        }
    }

    return (
        // Mobile: Solid white background. Desktop: Gradient background.
        <div className="min-h-screen bg-white md:bg-gradient-to-b md:from-[#fef7f0] md:via-white md:to-[#f0fdf4] flex flex-col overflow-x-hidden relative">
            
            {/* HEADER */}
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

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex items-start md:items-center justify-center px-4 md:px-6 pt-6 md:pt-0 pb-12 md:pb-20 relative">
                
                {/* Decorative floating icons - Hidden entirely on mobile to save space & reduce clutter */}
                <div className="hidden md:flex absolute top-20 left-20 w-14 h-14 rounded-2xl bg-white shadow-lg items-center justify-center z-10 animate-bounce" style={{ animationDuration: '3s' }}>
                    <Heart className="w-7 h-7 text-[#ff6b6b]" />
                </div>
                <div className="hidden md:flex absolute top-32 right-24 w-14 h-14 rounded-2xl bg-white shadow-lg items-center justify-center z-10 animate-bounce" style={{ animationDuration: '4s' }}>
                    <Sparkles className="w-7 h-7 text-[#f59e0b]" />
                </div>
                <div className="hidden md:flex absolute bottom-32 left-32 w-14 h-14 rounded-2xl bg-white shadow-lg items-center justify-center z-10 animate-bounce" style={{ animationDuration: '3.5s' }}>
                    <Users className="w-7 h-7 text-[#3b82f6]" />
                </div>
                <div className="hidden md:flex absolute bottom-40 right-40 w-14 h-14 rounded-2xl bg-white shadow-lg items-center justify-center z-10 animate-bounce" style={{ animationDuration: '4.5s' }}>
                    <Star className="w-7 h-7 text-[#10b981]" />
                </div>

                <div className="w-full max-w-[480px] relative">
                    
                    {/* Decorative blur elements - Desktop only */}
                    <div className="hidden md:block absolute -top-10 -left-10 w-20 h-20 bg-gradient-to-br from-[#ffecd2]/40 to-[#fcb69f]/40 rounded-full blur-2xl" />
                    <div className="hidden md:block absolute -bottom-10 -right-10 w-24 h-24 bg-gradient-to-br from-[#a8edea]/40 to-[#fed6e3]/40 rounded-full blur-2xl" />

                    {/* THE AUTH CARD */}
                    <div className="relative bg-white md:bg-white/80 md:backdrop-blur-sm rounded-none md:rounded-3xl p-2 md:p-10 md:shadow-[0_2px_40px_-12px_rgba(0,0,0,0.1)] overflow-hidden transition-all duration-500">
                        
                        {isForgotPassword ? (
                            /* ========================================================= */
                            /* FORGOT PASSWORD VIEW                                      */
                            /* ========================================================= */
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <button 
                                    onClick={() => {
                                        setIsForgotPassword(false);
                                        setResetStatus("idle");
                                        setResetMessage("");
                                    }}
                                    className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors mb-6"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>

                                <h1 className="text-[28px] md:text-[40px] font-bold text-[#1d1d1f] tracking-tight leading-tight">
                                    Reset Password
                                </h1>
                                <p className="text-[15px] md:text-[17px] text-[#86868b] mt-2 mb-8 md:mb-10">
                                    Enter your email address and we'll send you a secure link to reset your password.
                                </p>

                                {resetStatus === "success" ? (
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center animate-in zoom-in-95 duration-300">
                                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                        </div>
                                        <h3 className="text-lg font-bold text-emerald-900 mb-2">Email Sent!</h3>
                                        <p className="text-sm text-emerald-700 font-medium">
                                            {resetMessage}
                                        </p>
                                        <Button
                                            onClick={() => setIsForgotPassword(false)}
                                            className="w-full h-12 mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25"
                                        >
                                            Return to Login
                                        </Button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleResetPassword} className="space-y-4 md:space-y-5">
                                        
                                        {resetStatus === "error" && (
                                            <div className="flex items-start gap-3 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-medium">
                                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                                <p>{resetMessage}</p>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <Label htmlFor="reset-email" className="text-[11px] md:text-xs text-[#86868b] font-bold uppercase tracking-wider ml-1">
                                                Email Address
                                            </Label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <Input
                                                    id="reset-email"
                                                    type="email"
                                                    placeholder="name@example.com"
                                                    value={resetEmail}
                                                    onChange={(e) => setResetEmail(e.target.value)}
                                                    required
                                                    className="h-12 md:h-14 pl-12 bg-[#f5f5f7] border-0 rounded-xl text-[16px] md:text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] focus-visible:ring-2 focus-visible:ring-[#ff6b6b]"
                                                />
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={resetStatus === "loading" || !resetEmail}
                                            className="w-full h-12 md:h-14 bg-gradient-to-r from-[#1d1d1f] to-[#424245] hover:from-black hover:to-[#1d1d1f] text-white text-[16px] md:text-[17px] font-bold rounded-xl mt-4 shadow-lg shadow-gray-900/20 active:scale-[0.98] transition-all disabled:opacity-70"
                                        >
                                            {resetStatus === "loading" ? (
                                                <span className="flex items-center gap-2">
                                                    <Loader2 className="w-5 h-5 animate-spin" /> Sending Link...
                                                </span>
                                            ) : (
                                                "Send Reset Link"
                                            )}
                                        </Button>
                                    </form>
                                )}
                            </div>
                        ) : (
                            /* ========================================================= */
                            /* STANDARD LOGIN VIEW                                       */
                            /* ========================================================= */
                            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                                <h1 className="text-[28px] md:text-[40px] font-bold text-[#1d1d1f] tracking-tight text-center leading-tight">
                                    Welcome Back.
                                </h1>
                                <p className="text-[15px] md:text-[17px] text-[#86868b] text-center mt-2 mb-8 md:mb-10">
                                    Sign in to continue making a difference.
                                </p>

                                <form
                                    onSubmit={handleLogin}
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

                                    {/* THE UPDATED FORGOT PASSWORD BUTTON */}
                                    <div className="flex justify-end pt-1">
                                        <button 
                                            type="button"
                                            onClick={() => setIsForgotPassword(true)}
                                            className="text-[12px] md:text-[13px] font-semibold text-[#ff6b6b] hover:underline"
                                        >
                                            Forgot your password?
                                        </button>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-12 md:h-14 bg-gradient-to-r from-[#ff6b6b] to-[#ee5a5a] hover:from-[#ff5252] hover:to-[#e04848] text-white text-[16px] md:text-[17px] font-bold rounded-xl mt-2 shadow-lg shadow-[#ff6b6b]/25 active:scale-[0.98] transition-all"
                                    >
                                        Sign In
                                    </Button>
                                </form>

                                <p className="text-center mt-8 md:mt-10 text-[14px] md:text-[15px] text-[#86868b] pb-4">
                                    Don't have an account?{" "}
                                    <Link href="/#hero" className="text-[#ff6b6b] hover:underline font-bold">
                                        Sign up
                                    </Link>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Brand wipe — only mounts after an explicit successful login */}
            <BrandSplash show={showSplash} onDone={handleSplashDone} />
        </div>
    )
}