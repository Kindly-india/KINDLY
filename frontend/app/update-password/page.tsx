"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
    Eye, 
    EyeOff, 
    ChevronLeft, 
    Lock, 
    CheckCircle2, 
    AlertCircle, 
    Loader2 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"

export default function UpdatePasswordPage() {
    const router = useRouter()
    
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
    const [message, setMessage] = useState("")
    const [hasToken, setHasToken] = useState(true) 
    
    // NEW: State to safely store the token before Next.js wipes the URL
    const [hashToken, setHashToken] = useState("")

    useEffect(() => {
        const hash = window.location.hash
        if (!hash || !hash.includes('access_token')) {
            setHasToken(false)
        } else {
            // Save it safely in state!
            setHashToken(hash)
        }
    }, [])

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (password.length < 6) {
            setStatus("error")
            setMessage("Password must be at least 6 characters long.")
            return
        }

        if (password !== confirmPassword) {
            setStatus("error")
            setMessage("Passwords do not match.")
            return
        }
        
        setStatus("loading")
        try {
            // Pass BOTH the password and the securely stored token to the API
            await api.updatePassword(password, hashToken)
            setStatus("success")
            setMessage("Your password has been successfully updated!")
        } catch (err: any) {
            setStatus("error")
            setMessage(err.message || "Failed to update password. Your link may have expired.")
        }
    }

    return (
        <div className="min-h-screen bg-background md:bg-gradient-to-b md:from-[#fef7f0] dark:from-[#fef7f0]/10 md:via-white dark:via-background md:to-[#f0fdf4] dark:to-[#f0fdf4]/10 flex flex-col overflow-x-hidden relative">
            
            <header className="pt-6 md:pt-12 pb-3 md:pb-6 px-4 md:px-8 flex items-center justify-between relative z-20">
                <button
                    onClick={() => router.push('/login')}
                    className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors p-2 -ml-2"
                >
                    <ChevronLeft className="w-5 h-5" />
                    <span className="hidden md:inline">Back to Login</span>
                </button>

                <div className="absolute left-1/2 -translate-x-1/2">
                    <img src="/logo.png" alt="Kindly Logo" className="h-5 md:h-6 object-contain dark:invert" />
                </div>
                
                <div className="w-20"></div>
            </header>

            <main className="flex-1 flex items-start md:items-center justify-center px-4 md:px-6 pt-6 md:pt-0 pb-12 md:pb-20 relative">
                
                <div className="w-full max-w-[480px] relative">
                    <div className="hidden md:block absolute -top-10 -left-10 w-20 h-20 bg-gradient-to-br from-[#ffecd2]/40 dark:from-[#ffecd2]/10 to-[#fcb69f]/40 dark:to-[#fcb69f]/10 rounded-full blur-2xl" />
                    <div className="hidden md:block absolute -bottom-10 -right-10 w-24 h-24 bg-gradient-to-br from-[#a8edea]/40 dark:from-[#a8edea]/10 to-[#fed6e3]/40 dark:to-[#fed6e3]/10 rounded-full blur-2xl" />

                    <div className="relative bg-card md:bg-card/80 md:backdrop-blur-sm rounded-none md:rounded-3xl p-2 md:p-10 md:shadow-[0_2px_40px_-12px_rgba(0,0,0,0.1)] overflow-hidden">
                        
                        {!hasToken ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-red-50 dark:bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertCircle className="w-8 h-8 text-red-500" />
                                </div>
                                <h1 className="text-2xl font-bold text-foreground mb-2">Invalid Link</h1>
                                <p className="text-sm text-muted-foreground mb-8">
                                    This password reset link is invalid or has expired. Please request a new one.
                                </p>
                                <Button
                                    onClick={() => router.push('/login')}
                                    className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-bold"
                                >
                                    Return to Login
                                </Button>
                            </div>
                        ) : status === "success" ? (
                            <div className="text-center py-8 animate-in zoom-in-95 duration-300">
                                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                                </div>
                                <h1 className="text-2xl font-bold text-foreground mb-2">Password Updated!</h1>
                                <p className="text-sm text-muted-foreground mb-8">
                                    {message}
                                </p>
                                <Button
                                    onClick={() => router.push('/login')}
                                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/25"
                                >
                                    Sign In Now
                                </Button>
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h1 className="text-[28px] md:text-[40px] font-bold text-foreground tracking-tight text-center leading-tight">
                                    Secure Account
                                </h1>
                                <p className="text-[15px] md:text-[17px] text-muted-foreground text-center mt-2 mb-8 md:mb-10">
                                    Create a new, strong password below.
                                </p>

                                <form onSubmit={handleUpdatePassword} className="space-y-4 md:space-y-5">
                                    
                                    {status === "error" && (
                                        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-500/15 text-red-600 rounded-xl border border-red-100 text-sm font-medium">
                                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                            <p>{message}</p>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label className="text-[11px] md:text-xs text-muted-foreground font-bold uppercase tracking-wider ml-1">
                                            New Password
                                        </Label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Enter new password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="h-12 md:h-14 pl-12 pr-12 bg-muted border-0 rounded-xl text-[16px] md:text-[17px] text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-[#ff6b6b]"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-2"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[11px] md:text-xs text-muted-foreground font-bold uppercase tracking-wider ml-1">
                                            Confirm Password
                                        </Label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                            <Input
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="Confirm new password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                className="h-12 md:h-14 pl-12 pr-12 bg-muted border-0 rounded-xl text-[16px] md:text-[17px] text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-[#ff6b6b]"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-2"
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={status === "loading"}
                                        className="w-full h-12 md:h-14 bg-gradient-to-r from-[#ff6b6b] to-[#ee5a5a] hover:from-[#ff5252] hover:to-[#e04848] text-white text-[16px] md:text-[17px] font-bold rounded-xl mt-4 shadow-lg shadow-[#ff6b6b]/25 active:scale-[0.98] transition-all disabled:opacity-70"
                                    >
                                        {status === "loading" ? (
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="w-5 h-5 animate-spin" /> Securing Account...
                                            </span>
                                        ) : (
                                            "Update Password"
                                        )}
                                    </Button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}