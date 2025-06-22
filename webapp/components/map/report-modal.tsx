"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, MapPin, Loader2 } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface ReportModalProps {
  open: boolean
  onClose: () => void
  onReportSubmitted?: () => void
}

interface LocationSuggestion {
  display_name: string
  lat: string
  lon: string
}

export default function ReportModal({ open, onClose, onReportSubmitted }: ReportModalProps) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    city: "",
    description: "",
    lat: "",
    lon: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [useCurrentLocation, setUseCurrentLocation] = useState(false)
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Search for city suggestions
  const searchCities = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query,
        )}&limit=5&addressdetails=1&countrycodes=us`,
      )
      const data = await response.json()

      const locationSuggestions: LocationSuggestion[] = data.map((item: any) => ({
        display_name: item.display_name,
        lat: item.lat,
        lon: item.lon,
      }))

      setSuggestions(locationSuggestions)
      setShowSuggestions(true)
    } catch (error) {
      console.error("Error searching cities:", error)
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  // Handle city input change with debouncing
  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData((prev) => ({ ...prev, city: value, lat: "", lon: "" }))

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    // Set new timeout for search
    const timeout = setTimeout(() => {
      searchCities(value)
    }, 300)

    setSearchTimeout(timeout)
  }

  // COMPLETELY REWRITTEN suggestion selection
  const selectSuggestion = (suggestion: LocationSuggestion) => {
    // Immediately update form data
    setFormData({
      city: suggestion.display_name,
      description: formData.description, // Keep existing description
      lat: suggestion.lat,
      lon: suggestion.lon,
    })

    // Hide suggestions
    setShowSuggestions(false)
    setSuggestions([])

    console.log("Selected suggestion:", suggestion)
    console.log("Updated form data:", {
      city: suggestion.display_name,
      lat: suggestion.lat,
      lon: suggestion.lon,
    })
  }

  // Handle current location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert(t("map.reportModal.geolocationNotSupported"))
      return
    }

    setUseCurrentLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        try {
          // Reverse geocode to get city name
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          )
          const data = await response.json()

          setFormData((prev) => ({
            ...prev,
            city: data.display_name || `${latitude}, ${longitude}`,
            lat: latitude.toString(),
            lon: longitude.toString(),
          }))
        } catch (error) {
          console.error("Error reverse geocoding:", error)
          setFormData((prev) => ({
            ...prev,
            city: `${latitude}, ${longitude}`,
            lat: latitude.toString(),
            lon: longitude.toString(),
          }))
        }

        setUseCurrentLocation(false)
      },
      (error) => {
        console.error("Geolocation error:", error)
        alert(t("map.reportModal.locationError"))
        setUseCurrentLocation(false)
      },
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.city || !formData.lat || !formData.lon) {
      alert(t("map.reportModal.fillRequired"))
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/ice-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        alert(t("map.reportModal.success"))
        setFormData({ city: "", description: "", lat: "", lon: "" })
        onReportSubmitted?.()
        onClose()
      } else {
        throw new Error("Failed to submit report")
      }
    } catch (error) {
      console.error("Submit error:", error)
      alert(t("map.reportModal.error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Close suggestions when clicking outside - IMPROVED
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      // Don't close if clicking on input or suggestions
      if (inputRef.current?.contains(target) || suggestionsRef.current?.contains(target)) {
        return
      }

      setShowSuggestions(false)
    }

    if (showSuggestions) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showSuggestions])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTimeout])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {t("map.reportModal.title")}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium mb-1">{t("map.reportModal.cityLabel")}</label>
              <Input
                ref={inputRef}
                value={formData.city}
                onChange={handleCityChange}
                placeholder={t("map.reportModal.cityPlaceholder")}
                required
                autoComplete="off"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-[10000] max-h-48 overflow-y-auto"
                >
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm border-b border-gray-100 last:border-b-0 cursor-pointer"
                      onClick={() => selectSuggestion(suggestion)}
                    >
                      {suggestion.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGetLocation}
              disabled={useCurrentLocation}
              className="w-full"
            >
              {useCurrentLocation ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("map.reportModal.gettingLocation")}
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  {t("map.reportModal.useCurrentLocation")}
                </>
              )}
            </Button>

            <div>
              <label className="block text-sm font-medium mb-1">{t("map.reportModal.descriptionLabel")}</label>
              <textarea
                className="w-full p-2 border border-gray-300 rounded-md resize-none"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder={t("map.reportModal.descriptionPlaceholder")}
              />
            </div>

            {/* Status indicator */}
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              Status: {formData.city ? `✓ City: ${formData.city.substring(0, 30)}...` : "❌ No city selected"} |
              {formData.lat && formData.lon ? " ✓ Coordinates ready" : " ❌ No coordinates"}
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                {t("map.reportModal.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting || !formData.lat || !formData.lon} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("map.reportModal.submitting")}
                  </>
                ) : (
                  t("map.reportModal.submit")
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
