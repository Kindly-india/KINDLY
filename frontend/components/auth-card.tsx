"use client"

import { useEffect, useState } from "react"
import type { SVGProps } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Building2, Fingerprint, Loader2, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { supabase, supabaseAuthClient } from "@/lib/supabase"
import { api } from "@/lib/api"
import { BrandSplash } from "@/components/brand-splash"

type Step = "entry" | "code" | "name" | "passkey-offer"

// Shared sizing so every field/button in the flow reads as one small, tight
// Apple/Luma-style form instead of the oversized 48-56px controls it shipped with.
const FIELD_H = "h-11 md:h-12"

function GoogleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.26A12 12 0 0 0 0 12c0 1.94.46 3.77 1.26 5.38l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.26 6.62l4 3.1C6.22 6.86 8.87 4.75 12 4.75Z" />
    </svg>
  )
}

// proxy.ts gates /home and /org-home on this cookie — without it the request
// never reaches the page and bounces back through /login (which redirects to
// "/"), landing the user back on the marketing page instead of their home feed.
// user_metadata.user_type is the same field api.getUserProfile() reads, so an
// already-registered organization signing in here still lands on /org-home
// instead of being defaulted into the volunteer experience.
function destinationForUserType(userType?: string): { role: "volunteer" | "org"; home: string } {
  return userType === "organization"
    ? { role: "org", home: "/org-home" }
    : { role: "volunteer", home: "/home" }
}

function applyRoleSession(role: "volunteer" | "org") {
  document.cookie = `kindly_role=${role}; path=/; max-age=604800; SameSite=Lax`
}

// supabase.auth.passkey.list() — the public wrapper around the same beta
// /passkeys endpoint registerPasskey() writes to. Used to check whether the
// signed-in user already has one saved, so returning users aren't asked to
// save a passkey on every single login.
async function hasRegisteredPasskey(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.passkey.list()
    return Array.isArray(data) && data.length > 0
  } catch {
    return false
  }
}

// A name field that smoothly grows open beneath the heading instead of a
// redirect or modal — CSS grid-rows is the only way to animate to "auto"
// height without measuring the DOM by hand.
function NameCapture({
  onSubmit,
  submitting,
}: {
  onSubmit: (name: string) => void
  submitting: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [name, setName] = useState("")

  useEffect(() => {
    const raf = requestAnimationFrame(() => setExpanded(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="animate-in fade-in duration-300">
      <h1 className="text-[22px] md:text-[26px] font-bold text-foreground tracking-tight text-center leading-tight">
        What should we call you?
      </h1>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (name.trim()) onSubmit(name.trim())
            }}
            className="space-y-3 pt-5"
          >
            <Input
              id="fullName"
              autoFocus
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={`${FIELD_H} bg-muted border-0 rounded-xl text-[16px] text-foreground placeholder:text-muted-foreground px-4`}
            />
            <Button
              type="submit"
              disabled={submitting || !name.trim()}
              className={`w-full ${FIELD_H} bg-primary text-primary-foreground font-semibold rounded-xl active:scale-[0.98] transition-all disabled:opacity-70`}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </span>
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

/**
 * Unified passwordless entry point (Luma-style): one card, one continue action,
 * used for both signup and login. Email OTP + verification + Passkey sign-in/
 * registration are wired to real Supabase calls. Google is still stubbed —
 * wire the remaining TODO(auth-provider) spot up when ready.
 *
 * Phone/SMS OTP is intentionally not implemented yet (no SMS provider wired
 * up) — email is the only path for now, revisit when that's ready.
 */
export function AuthCard() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("entry")
  const [identifier, setIdentifier] = useState("")
  const [code, setCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPasskeyBusy, setIsPasskeyBusy] = useState(false)
  const [passkeySupported, setPasskeySupported] = useState(false)
  const [homeDestination, setHomeDestination] = useState("/home")
  const [showSplash, setShowSplash] = useState(false)
  const [pendingRoute, setPendingRoute] = useState("/home")

  // Step 4: only light up the Passkey button on browsers that actually implement it.
  useEffect(() => {
    setPasskeySupported(typeof window !== "undefined" && !!window.PublicKeyCredential)
  }, [])

  const goWithSplash = (route: string) => {
    setPendingRoute(route)
    setShowSplash(true)
  }

  // Only offer to save a passkey if the browser can do it AND the user
  // doesn't already have one registered — otherwise this fires on every login.
  const goHomeOrOfferPasskey = async (home: string) => {
    const alreadyHasPasskey = passkeySupported && (await hasRegisteredPasskey())
    if (passkeySupported && !alreadyHasPasskey) {
      setStep("passkey-offer")
    } else {
      goWithSplash(home)
    }
  }

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier) return
    setIsSubmitting(true)
    try {
      // Organizations are password-less and gated by admin approval — an
      // email that belongs to a still-pending application must not be able
      // to self-provision a brand-new account through the ordinary OTP flow.
      const { status } = await api.checkOrgApplicationStatus(identifier)
      if (status === "pending") {
        toast.error("Your organization application is still under review. We'll email you once it's approved.")
        return
      }

      const { error } = await supabaseAuthClient.auth.signInWithOtp({
        email: identifier,
        options: { shouldCreateUser: true },
      })
      if (error) throw error
      setStep("code")
    } catch (error: any) {
      toast.error(error.message || "Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) return
    setIsSubmitting(true)
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: identifier,
        token: code,
        type: "email",
      })
      if (error) throw error
      const { role, home } = destinationForUserType(data.user?.user_metadata?.user_type)
      applyRoleSession(role)
      setHomeDestination(home)

      if (role === "org") {
        await goHomeOrOfferPasskey(home)
        return
      }

      // Brand-new OTP signups never get a volunteer_profiles row created
      // (unlike the old password-based signup, which always inserted one
      // alongside the auth user) — verifyOtp succeeding is not the same as
      // having a profile. Detect that here and route through name capture
      // + onboarding instead of dropping them on /home with no data.
      const profileRes = await api.getUserProfile().catch(() => null)
      if (profileRes?.profile) {
        await goHomeOrOfferPasskey(home)
      } else {
        setStep("name")
      }
    } catch (error: any) {
      toast.error(error.message || "Invalid code. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitName = async (name: string) => {
    setIsSubmitting(true)
    try {
      await api.ensureVolunteerProfile(name)
      goWithSplash("/onboarding")
    } catch (error: any) {
      toast.error(error.message || "Couldn't save your name. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegisterPasskey = async () => {
    setIsSubmitting(true)
    try {
      const { error } = await supabase.auth.registerPasskey()
      if (error) throw error
      toast.success("Passkey saved — you can use it to sign in next time.")
    } catch (error: any) {
      toast.error(error.message || "Couldn't save a passkey on this device.")
    } finally {
      setIsSubmitting(false)
      goWithSplash(homeDestination)
    }
  }

  const handleSkipPasskey = () => {
    goWithSplash(homeDestination)
  }

  const handleGoogle = () => {
    // TODO(auth-provider): await supabase.auth.signInWithOAuth({ provider: "google" })
    toast.info("Google sign-in is coming soon.")
  }

  const handlePasskeySignIn = async () => {
    if (!passkeySupported || isPasskeyBusy) return
    setIsPasskeyBusy(true)
    try {
      const { data, error } = await supabase.auth.signInWithPasskey()
      if (error) throw error
      if (!data?.session) throw new Error("No session returned. Please try again.")
      const { role, home } = destinationForUserType(data.session.user?.user_metadata?.user_type)
      applyRoleSession(role)
      goWithSplash(home)
    } catch (error: any) {
      // Step 3: graceful fallback — user cancelling the OS prompt is not a real
      // error, everything else gets a clean message without breaking the form.
      const cancelled =
        error?.name === "NotAllowedError" || /cancel/i.test(error?.message || "")
      toast.error(
        cancelled
          ? "Passkey sign-in was cancelled."
          : error.message || "Passkey sign-in failed. Try email instead."
      )
    } finally {
      setIsPasskeyBusy(false)
    }
  }

  let content: React.ReactNode

  if (step === "name") {
    content = <NameCapture onSubmit={handleSubmitName} submitting={isSubmitting} />
  } else if (step === "passkey-offer") {
    content = (
      <div className="animate-in fade-in slide-in-from-right-4 duration-300 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-5">
          <ShieldCheck className="w-6 h-6 text-primary" />
        </div>

        <h1 className="text-[22px] md:text-[26px] font-bold text-foreground tracking-tight leading-tight">
          Save a passkey?
        </h1>
        <p className="text-[13px] md:text-[14px] text-muted-foreground mt-2 mb-6">
          Use Face ID, Touch ID, or your device screen lock to sign in next time — no code needed.
        </p>

        <div className="space-y-2">
          <Button
            type="button"
            onClick={handleRegisterPasskey}
            disabled={isSubmitting}
            className={`w-full ${FIELD_H} bg-primary text-primary-foreground font-semibold rounded-xl active:scale-[0.98] transition-all disabled:opacity-70`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </span>
            ) : (
              "Save Passkey"
            )}
          </Button>
          <button
            type="button"
            onClick={handleSkipPasskey}
            disabled={isSubmitting}
            className="w-full text-center text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors py-2 disabled:opacity-50"
          >
            Skip for now
          </button>
        </div>
      </div>
    )
  } else if (step === "code") {
    content = (
      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
        <h1 className="text-[22px] md:text-[26px] font-bold text-foreground tracking-tight leading-tight">
          Enter your code
        </h1>
        <p className="text-[13px] md:text-[14px] text-muted-foreground mt-1.5 mb-6">
          We sent a 6-digit code to <span className="font-semibold text-foreground">{identifier}</span>.
        </p>

        <form onSubmit={handleVerify} className="space-y-3">
          <Input
            id="code"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            required
            className={`${FIELD_H} bg-muted border-0 rounded-xl text-[18px] tracking-[0.5em] text-center font-bold text-foreground placeholder:text-muted-foreground placeholder:tracking-[0.5em]`}
          />

          <Button
            type="submit"
            disabled={isSubmitting || code.length !== 6}
            className={`w-full ${FIELD_H} bg-primary text-primary-foreground font-semibold rounded-xl active:scale-[0.98] transition-all disabled:opacity-70`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
              </span>
            ) : (
              "Verify & Continue"
            )}
          </Button>

          <div className="flex items-center justify-between px-1 pt-1">
            <button
              type="button"
              onClick={() => setStep("entry")}
              className="text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleContinue}
              className="text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Resend code
            </button>
          </div>
        </form>
      </div>
    )
  } else {
    content = (
      <div className="animate-in fade-in slide-in-from-left-4 duration-300">
        <h1 className="text-[22px] md:text-[26px] font-bold text-foreground tracking-tight text-center leading-tight">
          Welcome to KINDLY.
        </h1>
        <p className="text-[13px] md:text-[14px] text-muted-foreground text-center mt-1.5 mb-6">
          Sign in or sign up below.
        </p>

        <form onSubmit={handleContinue} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="identifier" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-1">
              Email
            </Label>
            <Input
              id="identifier"
              name="identifier"
              type="email"
              placeholder="name@example.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              // CRITICAL: text-[16px] required for mobile iOS zoom fix!
              className={`${FIELD_H} bg-muted border-0 rounded-xl text-[16px] text-foreground placeholder:text-muted-foreground px-4`}
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || isPasskeyBusy || !identifier}
            className={`w-full ${FIELD_H} bg-primary text-primary-foreground font-semibold rounded-xl active:scale-[0.98] transition-all disabled:opacity-70`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Sending code...
              </span>
            ) : (
              "Continue with Email"
            )}
          </Button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="space-y-2">
          {/* <button
            type="button"
            onClick={handleGoogle}
            disabled={isSubmitting || isPasskeyBusy}
            className={`w-full ${FIELD_H} flex items-center justify-center gap-2 bg-muted hover:bg-border/60 text-foreground font-medium text-[13px] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-muted`}
          >
            <GoogleIcon /> Sign in with Google
          </button> */}
          <button
            type="button"
            onClick={handlePasskeySignIn}
            disabled={!passkeySupported || isSubmitting || isPasskeyBusy}
            title={passkeySupported ? undefined : "Passkeys aren't supported on this browser"}
            className={`w-full ${FIELD_H} flex items-center justify-center gap-2 bg-muted hover:bg-border/60 text-foreground font-medium text-[13px] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-muted`}
          >
            {isPasskeyBusy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Fingerprint className="w-4 h-4" />
            )}
            Sign in with Passkey
          </button>
          <Link
            href="/org-signup"
            className={`w-full ${FIELD_H} flex items-center justify-center gap-2 bg-muted hover:bg-border/60 text-foreground font-medium text-[13px] rounded-xl transition-colors`}
          >
            <Building2 className="w-4 h-4" /> Continue as an Organization
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {content}
      <BrandSplash show={showSplash} onDone={() => router.push(pendingRoute)} />
    </>
  )
}
