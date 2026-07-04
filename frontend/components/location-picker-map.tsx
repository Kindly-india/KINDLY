"use client"

import { useEffect, useRef } from "react"
import "leaflet/dist/leaflet.css"

const NASHIK: [number, number] = [19.9975, 73.7898]

interface Props {
  latitude?: number
  longitude?: number
  onCoordinatesChange: (lat: number, lng: number) => void
  onCenterChange?: (lat: number, lng: number) => void
}

const PIN_ICON_HTML = `
  <svg width="28" height="40" viewBox="0 0 28 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26S28 24.5 28 14C28 6.268 21.732 0 14 0z" fill="#ef4444"/>
    <circle cx="14" cy="14" r="6" fill="white"/>
    <circle cx="14" cy="14" r="3" fill="#ef4444"/>
  </svg>
`

export function LocationPickerMap({ latitude, longitude, onCoordinatesChange, onCenterChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const onChangeRef = useRef(onCoordinatesChange)
  const onCenterRef = useRef(onCenterChange)
  onChangeRef.current = onCoordinatesChange
  onCenterRef.current = onCenterChange
  // Set right before a click/drag reports its new coordinates, so the prop
  // effect below can tell "user tapped the map" (marker already placed,
  // don't touch the zoom) apart from "coordinates arrived from outside"
  // (search selection, GPS button — the map needs to jump there).
  const isInternalChange = useRef(false)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let cancelled = false

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return

      const map = L.map(containerRef.current, {
        center: NASHIK,
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: false,
        // Explicit (matches Leaflet defaults, but stated here since this is
        // the primary touch surface on mobile — don't want a future default
        // change or plugin to silently disable pinch/drag here).
        touchZoom: true,
        dragging: true,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      const icon = L.divIcon({
        html: PIN_ICON_HTML,
        className: "",
        iconSize: [28, 40],
        iconAnchor: [14, 40],
      })

      const marker = L.marker(NASHIK, {
        draggable: true,
        icon,
        opacity: 0,
      }).addTo(map)

      marker.on("dragend", () => {
        const { lat, lng } = marker.getLatLng()
        isInternalChange.current = true
        onChangeRef.current(lat, lng)
      })

      // Tap/click anywhere on the map to drop the pin there directly —
      // dragging a tiny marker to an exact spot is fiddly on a phone screen.
      map.on("click", (e: any) => {
        marker.setLatLng(e.latlng)
        marker.setOpacity(1)
        isInternalChange.current = true
        onChangeRef.current(e.latlng.lat, e.latlng.lng)
      })

      map.on("moveend", () => {
        const center = map.getCenter()
        onCenterRef.current?.(center.lat, center.lng)
      })

      mapRef.current = map
      markerRef.current = marker
    })

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (latitude == null || longitude == null) return
    if (!mapRef.current || !markerRef.current) return
    if (isInternalChange.current) {
      // Marker position was already set directly by the click/dragend
      // handler — this round-trip through props is just for form state.
      isInternalChange.current = false
      return
    }
    markerRef.current.setLatLng([latitude, longitude])
    markerRef.current.setOpacity(1)
    mapRef.current.setView([latitude, longitude], 17)
  }, [latitude, longitude])

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden border border-border"
        // touch-action: none hands all touch gestures on this element to
        // Leaflet's own handlers instead of the browser's default pan/zoom —
        // needed because the app's global viewport config disables page
        // pinch-zoom (see app/layout.tsx), which otherwise fights with
        // Leaflet's touch handling on some mobile browsers.
        style={{ height: 300, touchAction: "none" }}
      />
      <p className="text-[11px] text-muted-foreground mt-1.5 text-center">
        Tap or drag the pin to your exact location
      </p>
    </div>
  )
}
