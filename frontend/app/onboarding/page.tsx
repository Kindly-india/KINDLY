"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, Variants } from "framer-motion"
import { api } from "@/lib/api"
import { BrandSplash } from "@/components/brand-splash"
import { INTEREST_TAG_ROWS as ROWS } from "@/lib/interest-tags"

// ─────────────────────────────────────────────
// Data & Constants
// ─────────────────────────────────────────────

const AVAILABILITY_OPTIONS = [
  { id: "weekends", label: "Weekends", sub: "Saturday & Sunday vibes" },
  { id: "weekdays", label: "Weekdays", sub: "Monday through Friday" },
  { id: "flexible", label: "Flexible", sub: "I make my own schedule" },
]

// ─────────────────────────────────────────────
// Shared Animation Variants & Physics
// ─────────────────────────────────────────────

const screenVariants: Variants = {
  initial: (dir: "forward" | "back") => ({
    x: dir === "forward" ? 80 : -80,
    opacity: 0,
    scale: 0.95,
    filter: "blur(8px)",
  }),
  animate: {
    x: 0,
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
  },
  exit: (dir: "forward" | "back") => ({
    x: dir === "forward" ? -60 : 60,
    opacity: 0,
    scale: 0.95,
    filter: "blur(8px)",
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  }),
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  },
}

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  },
}

const wait = (ms: number) => new Promise(res => setTimeout(res, ms))

// ─────────────────────────────────────────────
// Spectacular SVG Icons
// ─────────────────────────────────────────────

const BackIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const FallbackIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

const SoloIcon = ({ active }: { active: boolean }) => (
  <motion.svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={active ? "#80242a" : "var(--foreground)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeOut" }} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <motion.circle initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }} cx="12" cy="7" r="4" />
  </motion.svg>
)

const FriendsIcon = ({ active }: { active: boolean }) => (
  <motion.svg width="48" height="40" viewBox="0 0 24 24" fill="none" stroke={active ? "#80242a" : "var(--foreground)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5 }} d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <motion.circle initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: 0.1 }} cx="9" cy="7" r="4" />
    <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: 0.2 }} d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: 0.3 }} d="M16 3.13a4 4 0 0 1 0 7.75" />
  </motion.svg>
)

// ─────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────

function ImageWithFallback({ src, alt, selected }: { src: string, alt: string, selected: boolean }) {
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="absolute inset-0 w-full h-full bg-[#1c1c1e]">
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#2c2c2e] dark:from-[#2c2c2e]/10 to-[#1c1c1e] dark:to-[#1c1c1e]/10">
          <FallbackIcon />
        </div>
      ) : (
        <motion.img
          src={src}
          alt={alt}
          initial={{ opacity: 0 }}
          animate={{ opacity: loaded ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: selected ? "scale(1.08)" : "scale(1)", transition: "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}
          loading="lazy"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
    </div>
  )
}

function InteractiveCard({
  card,
  selected,
  onClick,
}: {
  card: { tag: string; label: string; photo: string }
  selected: boolean
  onClick: () => void
}) {
  const cardRef = useRef<HTMLButtonElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 })
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 })

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"])
  const glareOpacity = useTransform(mouseYSpring, [-0.5, 0.5], [0, 0.5])
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["-100%", "100%"])

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    x.set(mouseX / width - 0.5)
    y.set(mouseY / height - 0.5)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.button
      ref={cardRef}
      type="button"
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="shrink-0 relative focus:outline-none"
      style={{
        width: 170, // Bigger cards
        height: 240,
        borderRadius: 20,
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      animate={{
        scale: selected ? 1.05 : 1,
        zIndex: selected ? 20 : 10,
      }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div
        className="absolute inset-0 rounded-[20px] overflow-hidden"
        style={{
          boxShadow: selected
            ? "0 20px 40px -10px rgba(128,36,42,0.6)"
            : "0 10px 30px -10px rgba(0,0,0,0.2)",
          border: selected ? "3px solid #80242a" : "1px solid rgba(0,0,0,0.05)",
          transition: "all 0.3s ease"
        }}
      >
        <ImageWithFallback src={card.photo} alt={card.label} selected={selected} />

        <motion.div
          className="absolute inset-0 pointer-events-none mix-blend-overlay"
          style={{
            opacity: glareOpacity,
            background: "linear-gradient(to bottom, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 100%)",
            y: glareY,
          }}
        />

        <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col justify-end h-1/2">
          <p className="text-white text-[15px] font-bold leading-tight text-left drop-shadow-md">
            {card.label}
          </p>
        </div>

        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ scale: 0, opacity: 0, rotate: -45 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0, rotate: 45 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              className="absolute top-3 right-3 flex items-center justify-center bg-[#80242a] rounded-full shadow-xl"
              style={{ width: 28, height: 28 }}
            >
              <CheckIcon />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  )
}

function AnimatedMeshBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <motion.div
        animate={{
          x: [0, 50, 0, -50, 0],
          y: [0, -50, 50, 0, 0],
          scale: [1, 1.1, 0.9, 1.05, 1]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-[#80242a]/[0.03] blur-[100px]"
      />
      <motion.div
        animate={{
          x: [0, -60, 0, 40, 0],
          y: [0, 40, -60, 20, 0],
          scale: [1, 0.9, 1.1, 0.95, 1]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute top-[40%] -right-[20%] w-[60vw] h-[60vw] rounded-full bg-[#f3d2d5]/[0.15] blur-[120px]"
      />
      <div className="absolute inset-0 bg-muted/40 backdrop-blur-[50px]" />
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const [screen, setScreen] = useState(1)
  const [slideDir, setSlideDir] = useState<"forward" | "back">("forward")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [availability, setAvailability] = useState<string | null>(null)
  const [socialPref, setSocialPref] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showCurating, setShowCurating] = useState(false)
  const [showSplash, setShowSplash] = useState(false)

  useEffect(() => {
    const check = async () => {
      const profileRes = await api.getUserProfile().catch(() => null)
      if (profileRes?.profile?.onboarding_completed) {
        router.replace("/home")
      }
    }
    check()
  }, [router])

  const progressWidth = screen === 1 ? "33%" : screen === 2 ? "66%" : "100%"

  const goTo = (next: number) => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setSlideDir(next > screen ? "forward" : "back")
    setScreen(next)
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleSocialSelect = async (pref: string) => {
    setSocialPref(pref)
    setSubmitting(true)
    await wait(300)
    setShowCurating(true)

    const [patchResult] = await Promise.allSettled([
      api.patchOnboarding({
        interest_tags: selectedTags,
        preferred_availability: availability!,
        social_preference: pref,
      }),
      wait(1500),
    ])

    if (patchResult.status === "rejected") {
      setShowCurating(false)
      setErrorMessage("Network error. Tap to retry.")
      setSocialPref(null)
      setSubmitting(false)
      return
    }

    setShowSplash(true)
  }

  return (
    <div className="relative min-h-[100dvh] w-full bg-muted flex flex-col selection:bg-[#80242a]/20 font-sans">

      <AnimatedMeshBackground />

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-[4px] bg-black/5 z-50">
        <motion.div
          className="h-full bg-gradient-to-r from-[#5a181d] to-[#80242a]"
          initial={{ width: "0%" }}
          animate={{ width: progressWidth }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-12 left-1/2 -translate-x-1/2 z-[100]"
          >
            <button
              onClick={() => setErrorMessage(null)}
              className="bg-red-600 text-white text-[14px] font-semibold px-6 py-3 rounded-full shadow-2xl"
            >
              {errorMessage}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Screens Container */}
      <div className="flex-1 w-full relative z-10">
        <AnimatePresence mode="wait" custom={slideDir}>
          <motion.div
            key={screen}
            custom={slideDir}
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 w-full overflow-y-auto overflow-x-hidden pb-40"
          >
            <div className="min-h-full w-full max-w-[1400px] mx-auto">
              {screen === 1 && <Screen1 selectedTags={selectedTags} onToggle={toggleTag} />}
              {screen === 2 && <Screen2 selected={availability} onSelect={(id) => { setAvailability(id); setTimeout(() => goTo(3), 400) }} onBack={() => goTo(1)} />}
              {screen === 3 && <Screen3 selected={socialPref} submitting={submitting} onSelect={handleSocialSelect} onBack={() => goTo(2)} />}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Dynamic Island Action Bar (Screen 1) */}
      <AnimatePresence>
        {screen === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            // BUG FIX: Replaced left-1/2 -translate-x-1/2 with left-0 right-0 mx-auto
            className="fixed bottom-6 md:bottom-8 left-0 right-0 mx-auto z-40 w-[92%] max-w-md"
          >
            <div className="bg-card/80 backdrop-blur-xl border border-white/60 shadow-[0_15px_35px_-5px_rgba(0,0,0,0.15)] rounded-[2rem] p-2 flex items-center justify-between">
              <div className="pl-4 md:pl-6 flex flex-col">
                <span className="text-[10px] md:text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Selected</span>
                <span className={`text-[18px] md:text-[20px] font-bold leading-none transition-colors duration-300 ${selectedTags.length >= 3 ? "text-[#80242a]" : "text-foreground"}`}>
                  {selectedTags.length} <span className="text-[13px] md:text-[14px] text-muted-foreground font-medium">/ 3 minimum</span>
                </span>
              </div>
              <motion.button
                disabled={selectedTags.length < 3}
                onClick={() => goTo(2)}
                whileTap={{ scale: 0.95 }}
                className="shrink-0 h-[48px] md:h-[56px] px-6 md:px-8 rounded-full text-[15px] md:text-[16px] font-bold transition-all duration-300 bg-[#80242a] text-white shadow-[0_8px_20px_rgba(128,36,42,0.3)] disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
              >
                Continue
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic Curating Sequence */}
      <AnimatePresence>
        {showCurating && !showSplash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-muted/90 backdrop-blur-xl flex flex-col items-center justify-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="w-16 h-16 mb-8 rounded-full border-[4px] border-[#80242a]/10 border-t-[#80242a]"
            />
            <div className="flex space-x-1 overflow-hidden">
              {"Curating your world...".split("").map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.5, type: "spring" }}
                  className="text-[22px] font-semibold text-foreground tracking-tight"
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Final Brand Wipe Sequence — shared component, not a hand-duplicated
          copy, so it stays in sync with the AuthCard's splash automatically. */}
      <BrandSplash show={showSplash} onDone={() => router.push("/home")} duration={2200} />
    </div>
  )
}

// ─────────────────────────────────────────────
// Screen 1: The Grid
// ─────────────────────────────────────────────

function Screen1({ selectedTags, onToggle }: { selectedTags: string[], onToggle: (tag: string) => void }) {
  return (
    <div className="pt-20 md:pt-32 flex flex-col items-center">
      <motion.h1
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-[40px] md:text-[56px] font-bold text-foreground tracking-tight text-center px-6 mb-20 leading-[1.1]"
      >
        What gets you out <br /> on a Sunday?
      </motion.h1>

      <motion.div
        className="space-y-16 w-full"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {ROWS.map(row => (
          <motion.div key={row.label} variants={staggerItem} className="w-full flex flex-col items-center">
            <h2 className="text-[14px] font-bold text-[#80242a] uppercase tracking-[0.2em] mb-6 text-center w-full">
              {row.label}
            </h2>
            <div className="w-full max-w-[100vw] overflow-x-auto snap-x snap-mandatory flex gap-5 px-[5vw] md:px-[15vw] pb-8 pt-4 no-scrollbar">
              {row.cards.map(card => (
                <InteractiveCard
                  key={card.tag}
                  card={card}
                  selected={selectedTags.includes(card.tag)}
                  onClick={() => onToggle(card.tag)}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Screen 2: Availability
// ─────────────────────────────────────────────

function Screen2({ selected, onSelect, onBack }: { selected: string | null, onSelect: (id: string) => void, onBack: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 pt-24 max-w-2xl mx-auto relative min-h-[80vh]">
      <motion.button
        onClick={onBack}
        whileHover={{ x: -6, backgroundColor: "#F0F0F0" }}
        whileTap={{ scale: 0.9 }}
        className="absolute top-12 left-6 text-foreground p-4 bg-card rounded-full shadow-md border border-black/5"
      >
        <BackIcon />
      </motion.button>

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="text-[40px] md:text-[56px] font-bold text-foreground tracking-tight text-center mt-12 mb-20 leading-[1.1]"
      >
        When are you <br /> usually free?
      </motion.h1>

      <div className="flex flex-col gap-5 w-full">
        {AVAILABILITY_OPTIONS.map((opt, i) => {
          const isActive = selected === opt.id
          return (
            <motion.button
              key={opt.id}
              type="button"
              onClick={() => onSelect(opt.id)}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full relative overflow-hidden rounded-[2rem] border-2 flex items-center justify-between p-8 transition-all duration-500 shadow-sm ${isActive ? 'bg-[#80242a] border-[#80242a] shadow-xl' : 'bg-card border-transparent hover:border-border hover:shadow-lg'}`}
            >
              <div className="flex flex-col items-start z-10 text-left">
                <span className={`text-[24px] font-bold tracking-tight mb-1 transition-colors ${isActive ? "text-white" : "text-foreground"}`}>
                  {opt.label}
                </span>
                <span className={`text-[15px] font-medium transition-colors ${isActive ? "text-white/80" : "text-muted-foreground"}`}>
                  {opt.sub}
                </span>
              </div>

              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isActive ? 'border-white bg-card/20 scale-110' : 'border-border'}`}>
                {isActive && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-3 h-3 bg-card rounded-full" />}
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Screen 3: Social
// ─────────────────────────────────────────────

function Screen3({ selected, submitting, onSelect, onBack }: { selected: string | null, submitting: boolean, onSelect: (pref: string) => void, onBack: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 pt-24 max-w-4xl mx-auto relative min-h-[80vh]">
      <motion.button
        onClick={onBack}
        disabled={submitting}
        whileHover={{ x: -6, backgroundColor: "#F0F0F0" }}
        whileTap={{ scale: 0.9 }}
        className="absolute top-12 left-6 text-foreground p-4 bg-card rounded-full shadow-md border border-black/5 disabled:opacity-50"
      >
        <BackIcon />
      </motion.button>

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="text-[40px] md:text-[56px] font-bold text-foreground tracking-tight text-center mt-12 mb-20 leading-[1.1]"
      >
        One last thing — <br /> how do you show up?
      </motion.h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {[
          { id: "solo", title: "Solo", subtitle: "I'll find my people there", Icon: SoloIcon },
          { id: "with_friends", title: "With friends", subtitle: "I'm bringing a crew", Icon: FriendsIcon },
        ].map((opt, i) => {
          const isActive = selected === opt.id
          return (
            <motion.button
              key={opt.id}
              type="button"
              onClick={() => !submitting && onSelect(opt.id)}
              disabled={submitting}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              whileHover={!submitting ? { y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" } : {}}
              whileTap={!submitting ? { scale: 0.96 } : {}}
              className="flex flex-col items-center justify-center p-12 rounded-[2.5rem] bg-card border-[3px] relative overflow-hidden group transition-all duration-500 disabled:opacity-60"
              style={{
                height: 320,
                borderColor: isActive ? "#80242a" : "transparent",
                boxShadow: isActive ? "0 30px 60px -15px rgba(128,36,42,0.2)" : "0 10px 30px rgba(0,0,0,0.03)",
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeGlowSocial"
                  className="absolute inset-0 bg-gradient-to-b from-[#80242a]/[0.05] to-transparent pointer-events-none"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.8 }}
                />
              )}

              <div className="mb-10 transform transition-transform duration-700 group-hover:scale-110">
                <opt.Icon active={isActive} />
              </div>

              <span className={`text-[28px] font-bold tracking-tight mb-3 ${isActive ? "text-[#80242a]" : "text-foreground"}`}>
                {opt.title}
              </span>
              <span className="text-[16px] text-muted-foreground font-medium text-center max-w-[200px]">
                {opt.subtitle}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}