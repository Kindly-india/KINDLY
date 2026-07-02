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
        onChangeRef.current(lat, lng)
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
    markerRef.current.setLatLng([latitude, longitude])
    markerRef.current.setOpacity(1)
    mapRef.current.setView([latitude, longitude], 17)
  }, [latitude, longitude])

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden border border-border"
        style={{ height: 220 }}
      />
      <p className="text-[11px] text-muted-foreground mt-1.5 text-center">
        Drag the pin to your exact location
      </p>
    </div>
  )
}
