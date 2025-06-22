"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import { Icon } from "leaflet"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, MapPin, Loader2, AlertTriangle, MessageCircle, X } from "lucide-react"
import ReportModal from "./report-modal"
import "leaflet/dist/leaflet.css"

// Different colored markers for different sources
const scrapedIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// Create a custom red marker for reported incidents
const reportedIcon = new Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path fill="#dc2626" stroke="#991b1b" strokeWidth="1" d="M12.5,0 C19.4,0 25,5.6 25,12.5 C25,19.4 12.5,41 12.5,41 C12.5,41 0,19.4 0,12.5 C0,5.6 5.6,0 12.5,0 Z"/>
      <circle fill="white" cx="12.5" cy="12.5" r="7"/>
    </svg>
  `),
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

type IceReport = {
  id: string
  lat: number
  lon: number
  city: string
  date: string
  description?: string
  verified?: boolean
  source?: string
}

interface LocationSuggestion {
  display_name: string
  lat: string
  lon: string
}

interface IceActivityMapProps {
  className?: string
}

// Function to calculate distance between two coordinates in miles
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3959 // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export default function IceActivityMap({ className = "" }: IceActivityMapProps) {
  const { t } = useLanguage()
  const [isClient, setIsClient] = useState(false)
  const [reports, setReports] = useState<IceReport[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [hasUsedNearMe, setHasUsedNearMe] = useState(false)
  const [nearbyReports, setNearbyReports] = useState<IceReport[]>([])
  const [showProximityAlert, setShowProximityAlert] = useState(false)
  const mapRef = useRef<any>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchSuggestionsRef = useRef<HTMLDivElement>(null)

  // Ensure this only renders on client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Search for location suggestions
  const searchLocations = async (query: string) => {
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
      console.error("Error searching locations:", error)
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  // Handle search input change with debouncing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    // Set new timeout for search
    const timeout = setTimeout(() => {
      searchLocations(value)
    }, 300)

    setSearchTimeout(timeout)
  }

  // COMPLETELY REWRITTEN suggestion selection for search
  const selectSearchSuggestion = (suggestion: LocationSuggestion) => {
    setSearchTerm(suggestion.display_name)
    setShowSuggestions(false)
    setSuggestions([])

    // Move map to selected location
    if (mapRef.current) {
      mapRef.current.setView([Number.parseFloat(suggestion.lat), Number.parseFloat(suggestion.lon)], 12)
    }

    console.log("Selected search suggestion:", suggestion)
  }

  // Fetch reports from both FastAPI (via proxy) and MongoDB
  useEffect(() => {
    if (!isClient) return

    const fetchReports = async () => {
      setIsLoading(true)
      setError(null)
      console.log("🗺️ Starting to fetch reports...")

      try {
        let fastapiReports: any[] = []
        let mongoReports: any[] = []

        // Fetch from FastAPI via our proxy
        console.log("🌐 Fetching FastAPI data via proxy...")
        try {
          const fastapiResponse = await fetch("/api/fastapi-proxy")
          console.log("📡 FastAPI proxy response status:", fastapiResponse.status)

          if (fastapiResponse.ok) {
            fastapiReports = await fastapiResponse.json()
            console.log("📊 FastAPI data received via proxy:", fastapiReports)
            console.log("📊 FastAPI data length:", fastapiReports.length)

            // Log first few items if they exist
            if (fastapiReports.length > 0) {
              console.log("📊 First FastAPI report:", fastapiReports[0])
            }
          } else {
            console.error("❌ FastAPI proxy response not ok:", fastapiResponse.statusText)
          }
        } catch (err) {
          console.error("❌ FastAPI proxy fetch error:", err)
        }

        // Fetch from MongoDB
        console.log("🍃 Fetching from MongoDB...")
        try {
          const mongoResponse = await fetch("/api/ice-reports")
          console.log("📡 MongoDB API response status:", mongoResponse.status)

          if (mongoResponse.ok) {
            mongoReports = await mongoResponse.json()
            console.log("📊 MongoDB data received:", mongoReports)
            console.log("📊 MongoDB data length:", mongoReports.length)
          } else {
            console.error("❌ MongoDB response not ok:", mongoResponse.statusText)
          }
        } catch (err) {
          console.error("❌ MongoDB fetch error:", err)
        }

        console.log("🔄 FastAPI reports before transform:", fastapiReports)
        console.log("🔄 MongoDB reports before transform:", mongoReports)

        // Transform FastAPI reports to match our format
        const transformedFastapiReports: IceReport[] = fastapiReports
          .filter((report) => {
            const hasRequiredFields = report.lat && report.lon && report.city
            if (!hasRequiredFields) {
              console.log("⚠️ Filtering out FastAPI report missing required fields:", report)
            }
            return hasRequiredFields
          })
          .map((report) => ({
            id: `fastapi-${report.id}`,
            lat: Number.parseFloat(report.lat.toString()),
            lon: Number.parseFloat(report.lon.toString()),
            city: report.city,
            date: report.date,
            description: report.description || null,
            verified: false,
            source: "scraped",
          }))

        // Transform MongoDB reports (they should already be in the right format)
        const transformedMongoReports: IceReport[] = mongoReports
          .filter((report) => {
            const hasRequiredFields = report.lat && report.lon && report.city
            if (!hasRequiredFields) {
              console.log("⚠️ Filtering out MongoDB report missing required fields:", report)
            }
            return hasRequiredFields
          })
          .map((report) => ({
            id: `mongo-${report.id}`,
            lat: Number.parseFloat(report.lat.toString()),
            lon: Number.parseFloat(report.lon.toString()),
            city: report.city,
            date: report.date,
            description: report.description || null,
            verified: report.verified || false,
            source: "reported",
          }))

        // Combine all reports
        const allReports = [...transformedFastapiReports, ...transformedMongoReports]

        console.log("✅ Final FastAPI reports:", transformedFastapiReports)
        console.log("✅ Final MongoDB reports:", transformedMongoReports)
        console.log("✅ All combined reports:", allReports)
        console.log("📊 Total reports count:", allReports.length)

        setReports(allReports)
      } catch (err) {
        console.error("❌ Error fetching reports:", err)
        setError(t("map.error"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchReports()
  }, [isClient, t])

  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    console.log("🔍 Searching for location:", searchTerm)

    try {
      // Use a simple geocoding service (Nominatim - free OpenStreetMap service)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}&limit=1`,
      )
      const data = await response.json()

      if (data && data.length > 0) {
        const { lat, lon } = data[0]
        console.log("📍 Found location:", { lat, lon })

        if (mapRef.current) {
          mapRef.current.setView([Number.parseFloat(lat), Number.parseFloat(lon)], 12)
        }
      } else {
        alert(t("map.search.locationNotFound"))
      }
    } catch (error) {
      console.error("Search error:", error)
      alert(t("map.search.searchFailed"))
    }
  }

  const handleFindNearMe = () => {
    if (!navigator.geolocation) {
      alert(t("map.geolocation.notSupported"))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords

        // Move map to user location first
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 12)
        }

        // Mark as used to stop pulsating
        setHasUsedNearMe(true)

        // Check for nearby reports
        const nearby = reports.filter((report) => {
          const distance = calculateDistance(latitude, longitude, report.lat, report.lon)
          return distance <= 10 // Within 10 miles
        })

        console.log(`Found ${nearby.length} reports within 10 miles`)

        if (nearby.length > 0) {
          setNearbyReports(nearby)
          setShowProximityAlert(true)
        } else {
          // Hide alert if no nearby reports
          setShowProximityAlert(false)
          setNearbyReports([])
        }
      },
      () => {
        alert(t("map.geolocation.error"))
      },
    )
  }

  const handleGoToChatbot = () => {
    window.location.href = "/"
  }

  const handleCloseProximityAlert = () => {
    setShowProximityAlert(false)
  }

  const handleReportSubmitted = () => {
    // Refresh reports after new submission
    window.location.reload()
  }

  // Close suggestions when clicking outside - IMPROVED
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      // Don't close if clicking on search input or suggestions
      if (searchInputRef.current?.contains(target) || searchSuggestionsRef.current?.contains(target)) {
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

  if (!isClient) {
    return (
      <div className={`w-full h-64 md:h-[450px] bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <p className="text-gray-600 text-sm md:text-base">{t("map.loading")}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`w-full h-64 md:h-[450px] bg-red-50 rounded-lg flex items-center justify-center ${className}`}>
        <p className="text-red-600 text-sm md:text-base">{error}</p>
      </div>
    )
  }

  return (
    <div className={`w-full space-y-3 md:space-y-4 ${className}`}>
      <ReportModal open={modalOpen} onClose={() => setModalOpen(false)} onReportSubmitted={handleReportSubmitted} />

      {/* Data Source Attribution */}
      <div className="text-xs text-gray-500 text-center mb-2 md:mb-4">{t("map.poweredBy")}</div>

      {/* Search and Controls */}
      <div className="space-y-2 md:space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-3 w-3 md:h-4 md:w-4" />
          <Input
            ref={searchInputRef}
            placeholder={t("map.searchPlaceholder")}
            className="pl-8 md:pl-10 text-sm md:text-base h-8 md:h-10"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch()
                setShowSuggestions(false)
              }
            }}
            autoComplete="off"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={searchSuggestionsRef}
              className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-[10000] max-h-32 md:max-h-48 overflow-y-auto"
            >
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 text-xs md:text-sm border-b border-gray-100 last:border-b-0 cursor-pointer"
                  onClick={() => selectSearchSuggestion(suggestion)}
                >
                  {suggestion.display_name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleFindNearMe}
            className={`flex items-center gap-1 md:gap-2 relative text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 h-7 md:h-9 ${
              !hasUsedNearMe
                ? "bg-orange-500 hover:bg-orange-600 text-white animate-pulse shadow-lg ring-2 ring-orange-300 ring-opacity-50"
                : ""
            }`}
          >
            <MapPin className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">{t("map.checkActivityNearMe")}</span>
            <span className="sm:hidden">Near Me</span>
            {!hasUsedNearMe && (
              <div className="absolute -top-1 -right-1 w-2 h-2 md:w-3 md:h-3 bg-red-500 rounded-full animate-ping"></div>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 h-7 md:h-9"
          >
            <MapPin className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">{t("map.addReport")}</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* Proximity Alert Box */}
        {showProximityAlert && nearbyReports.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 md:p-4 relative animate-in slide-in-from-top-2 duration-300">
            <button
              onClick={handleCloseProximityAlert}
              className="absolute top-2 right-2 text-orange-400 hover:text-orange-600"
            >
              <X className="h-3 w-3 md:h-4 md:w-4" />
            </button>
            <div className="flex items-start gap-2 md:gap-3">
              <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 mb-1 text-sm md:text-base">
                  {t("map.proximityAlert.title")}
                </h3>
                <p className="text-xs md:text-sm text-orange-800 mb-2 md:mb-3 leading-relaxed">
                  {t("map.proximityAlert.message", {
                    count: nearbyReports.length.toString(),
                    plural: nearbyReports.length > 1 ? "s" : "",
                  })}
                </p>
                <Button
                  onClick={handleGoToChatbot}
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 h-6 md:h-8"
                >
                  <MessageCircle className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">{t("map.proximityAlert.button")}</span>
                  <span className="sm:hidden">Get Info</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs md:text-sm text-gray-600">
          {t("map.showingReports", { count: reports.length.toString() })}
          {isLoading && (
            <span className="ml-2 inline-flex items-center gap-1">
              <Loader2 className="h-2 w-2 md:h-3 md:w-3 animate-spin" />
              {t("map.loadingReports")}
            </span>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="w-full h-64 md:h-[450px] rounded-lg overflow-hidden border border-gray-200">
        <MapContainer
          center={[39.8283, -98.5795]} // Center of US
          zoom={4}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {reports.map((report) => (
            <Marker
              key={report.id}
              position={[report.lat, report.lon]}
              icon={report.source === "reported" ? reportedIcon : scrapedIcon}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-sm mb-1">{report.city}</h3>
                  <p className="text-xs text-gray-500 mb-2">{new Date(report.date).toLocaleDateString()}</p>
                  {report.description && <p className="text-xs text-gray-700 mb-2">{report.description}</p>}
                  <div className="flex items-center gap-2 text-xs">
                    {report.verified && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">{t("map.popup.verified")}</span>
                    )}
                    <span
                      className={`px-2 py-1 rounded ${
                        report.source === "reported"
                          ? "bg-red-100 text-red-600"
                          : report.source === "scraped"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {report.source === "reported"
                        ? t("map.popup.reported")
                        : report.source === "scraped"
                          ? t("map.popup.scraped")
                          : report.source}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
