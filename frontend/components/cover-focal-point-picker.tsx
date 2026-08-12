"use client"

import { useCallback, useRef, useState } from "react"
import { Crosshair } from "lucide-react"

export interface FocalPoint {
  x: number // 0-100
  y: number // 0-100
}

interface CoverFocalPointPickerProps {
  imageUrl: string
  value: FocalPoint
  onChange: (value: FocalPoint) => void
}

/**
 * Lets an organizer mark which part of a cover image should stay visible
 * when it's cropped for the app's different frames (tall mobile hero, wide
 * desktop hero, square thumbnails) instead of always cropping dead-center.
 * The two live previews below the pin render the actual crop shapes used
 * elsewhere in the app, so what's shown here matches what visitors see.
 */
export function CoverFocalPointPicker({ imageUrl, value, onChange }: CoverFocalPointPickerProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [dragging, setDragging] = useState(false)

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const el = imgRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))
      const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100))
      onChange({ x: Math.round(x), y: Math.round(y) })
    },
    [onChange]
  )

  const objectPosition = `${value.x}% ${value.y}%`

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-foreground mb-1">Focal point</p>
        <p className="text-xs text-muted-foreground">
          Click or drag on the photo to mark what should stay visible when it&apos;s cropped. The previews on the right update live.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div
          className="relative inline-block max-w-full select-none touch-none shrink-0 mx-auto sm:mx-0"
          style={{ cursor: dragging ? "grabbing" : "crosshair" }}
        >
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Cover"
            draggable={false}
            className="block max-w-full max-h-56 w-auto rounded-xl border border-border"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              setDragging(true)
              updateFromPointer(e.clientX, e.clientY)
            }}
            onPointerMove={(e) => {
              if (dragging) updateFromPointer(e.clientX, e.clientY)
            }}
            onPointerUp={() => setDragging(false)}
            onPointerCancel={() => setDragging(false)}
          />
          <div
            className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg bg-[#ff6b6b] pointer-events-none flex items-center justify-center"
            style={{ left: `${value.x}%`, top: `${value.y}%` }}
          >
            <Crosshair className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        <div className="flex gap-3 flex-1 min-w-0">
          <div className="space-y-1 w-24 shrink-0">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Mobile</p>
            <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-muted border border-border">
              <img
                src={imageUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition }}
              />
            </div>
          </div>
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Desktop</p>
            <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden bg-muted border border-border">
              <img
                src={imageUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
