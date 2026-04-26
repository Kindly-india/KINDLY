"use client"

import { useState } from "react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { X } from "lucide-react"

const PHONE_RE = /^[6-9]\d{9}$/

function stripPrefix(raw: string): string {
  return raw.trim().replace(/^(\+91|91)/, "").replace(/[\s\-]/g, "")
}

interface Props {
  onSaved: (phone: string) => void
  onClose: () => void
}

export function PhoneVerificationModal({ onSaved, onClose }: Props) {
  const [phone, setPhone] = useState("")
  const [saving, setSaving] = useState(false)
  const [touched, setTouched] = useState(false)

  const cleanPhone = stripPrefix(phone)
  const phoneValid = PHONE_RE.test(cleanPhone)

  const handleSave = async () => {
    if (!phoneValid || saving) return
    setSaving(true)
    try {
      await api.savePhone(cleanPhone)
      onSaved(cleanPhone)
    } catch (err: any) {
      toast.error(err.message || "Failed to save phone number")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />

      <div className="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center z-50 pointer-events-none">
        <div className="pointer-events-auto w-full md:max-w-sm bg-white rounded-t-2xl md:rounded-2xl shadow-xl px-6 pt-5 pb-10 md:pb-6">

          <div className="flex items-center justify-end mb-5">
            <button onClick={onClose} className="p-1 -mr-1 text-gray-400 hover:text-gray-900 active:scale-95 transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-[22px] font-bold text-gray-900 mb-1.5">One quick thing</h2>
          <p className="text-[14px] text-gray-500 mb-6 leading-snug">
            Add your phone number so the organizer can reach you if anything changes.
          </p>

          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-0.5">
            Phone number
          </label>
          <div className="flex gap-2 mt-1.5">
            <div className="h-12 px-4 bg-gray-100 rounded-xl flex items-center text-gray-500 font-bold shrink-0 text-[15px]">
              +91
            </div>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="10-digit mobile"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => setTouched(true)}
              autoFocus
              className={`flex-1 h-12 px-4 bg-gray-100 rounded-xl text-[16px] outline-none transition-all ${
                touched && !phoneValid && phone !== ""
                  ? "ring-2 ring-red-400"
                  : "focus:ring-2 focus:ring-[#80242a]/30"
              }`}
            />
          </div>
          {touched && !phoneValid && phone !== "" && (
            <p className="text-[12px] text-red-500 ml-0.5 mt-1.5">
              Enter a valid 10-digit mobile number
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={!phoneValid || saving}
            className="w-full h-[52px] rounded-full font-bold text-[15px] mt-5 flex items-center justify-center gap-2 transition-all
              disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed
              enabled:bg-[#80242a] enabled:text-white enabled:hover:opacity-90 enabled:active:scale-[0.98]"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Saving...
              </>
            ) : "Save & Continue"}
          </button>
        </div>
      </div>
    </>
  )
}
