import Image from "next/image"
import { Lock } from "lucide-react"
import { PRODUCT, type ProductKey, type ProductShot } from "@/lib/product-images"
import { cn } from "@/lib/utils"

interface FrameProps {
  shot: ProductKey
  className?: string
  priority?: boolean
  sizes?: string
}

/** Laptop-style browser window around a real desktop screenshot. */
export function BrowserFrame({ shot, className, priority, sizes = "(min-width: 1024px) 620px, 92vw" }: FrameProps) {
  const s: ProductShot = PRODUCT[shot]
  if (!s.desktop) return null
  return (
    <div className={cn("overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_30px_60px_-24px_rgba(60,25,15,0.38)] dark:border-white/10 dark:bg-neutral-900 dark:shadow-black/60", className)}>
      <div className="flex h-7 items-center gap-1.5 border-b border-black/5 bg-[#f4efe9] px-3 dark:border-white/10 dark:bg-neutral-800" aria-hidden>
        <span className="h-2 w-2 rounded-full bg-[#d8cdc0] dark:bg-neutral-600" />
        <span className="h-2 w-2 rounded-full bg-[#d8cdc0] dark:bg-neutral-600" />
        <span className="h-2 w-2 rounded-full bg-[#d8cdc0] dark:bg-neutral-600" />
        <span className="mx-auto flex h-4 min-w-[30%] items-center justify-center gap-1 rounded-full bg-white px-3 text-[9px] text-neutral-500 dark:bg-neutral-900">
          <Lock className="h-2 w-2" />
          kindly.co.in
        </span>
      </div>
      <Image src={s.desktop.src} width={s.desktop.width} height={s.desktop.height} alt={s.alt} priority={priority} sizes={sizes} className="block h-auto w-full" />
    </div>
  )
}

/** Phone around a real mobile screenshot (status bar added so the island never covers the app header). */
export function PhoneFrame({ shot, className, priority, sizes = "(min-width: 1024px) 200px, 40vw" }: FrameProps) {
  const s: ProductShot = PRODUCT[shot]
  if (!s.mobile) return null
  return (
    <div className={cn("relative rounded-[2.1rem] bg-neutral-900 p-[5px] shadow-[0_30px_50px_-18px_rgba(60,25,15,0.5)] ring-1 ring-black/20 dark:bg-neutral-700 dark:ring-white/10", className)}>
      <div className="relative aspect-[390/891] overflow-hidden rounded-[1.7rem] bg-white">
        <div className="absolute inset-x-0 top-0 z-10 flex h-[5.3%] items-center justify-between bg-white px-[9%] text-[8px] font-bold leading-none text-neutral-900" aria-hidden>
          <span>9:41</span>
          <span className="flex items-center gap-[3px]">
            <span className="h-[5px] w-[9px] rounded-[1px] bg-neutral-900" />
            <span className="h-[6px] w-[12px] rounded-[2px] border border-neutral-900" />
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 top-[5.3%]">
          <Image src={s.mobile.src} alt={s.alt} fill priority={priority} sizes={sizes} className="object-cover object-top" />
        </div>
        <div className="absolute left-1/2 top-[1.1%] z-20 h-[3.1%] w-[27%] -translate-x-1/2 rounded-full bg-black" aria-hidden />
      </div>
    </div>
  )
}

/** Laptop with a phone overlapping its lower-right corner. */
export function DeviceDuo({ desktop, mobile, className, priority }: { desktop: ProductKey; mobile: ProductKey; className?: string; priority?: boolean }) {
  return (
    <div className={cn("relative mx-auto w-full max-w-[680px] pb-[7%] pr-[3%]", className)}>
      <BrowserFrame shot={desktop} priority={priority} className="w-[88%]" sizes="(min-width: 1024px) 600px, 88vw" />
      <PhoneFrame shot={mobile} priority={priority} className="absolute bottom-0 right-0 w-[27%] min-w-[84px]" sizes="(min-width: 1024px) 180px, 28vw" />
    </div>
  )
}

/** Two or three phones side by side, gently staggered. */
export function PhoneTrio({ shots, className, priority }: { shots: ProductKey[]; className?: string; priority?: boolean }) {
  const lift = shots.length === 3 ? ["sm:translate-y-6", "", "sm:translate-y-6"] : shots.length === 2 ? ["sm:translate-y-5", ""] : [""]
  return (
    <div className={cn("mx-auto flex w-full max-w-[640px] items-start justify-center gap-3 sm:gap-6", className)}>
      {shots.map((k, i) => (
        <PhoneFrame key={k} shot={k} priority={priority} className={cn("w-[31%] max-w-[210px]", lift[i])} sizes="(min-width: 1024px) 210px, 30vw" />
      ))}
    </div>
  )
}
