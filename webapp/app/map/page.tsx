"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"
import LanguageToggle from "@/components/language-toggle"
import dynamic from "next/dynamic"

// Dynamically import the map component to avoid SSR issues
const IceActivityMap = dynamic(() => import("@/components/map/ice-activity-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 md:h-96 bg-gray-100 rounded-lg flex items-center justify-center">
      <p className="text-gray-600 text-sm md:text-base">Loading map...</p>
    </div>
  ),
})

export default function MapPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-2 md:p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <MapPin className="h-5 w-5 md:h-6 md:w-6 text-blue-600 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="text-base md:text-xl font-semibold text-gray-900 truncate">{t("map.title")}</h1>
              <p className="text-xs md:text-sm text-gray-600 truncate hidden md:block">{t("map.subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <LanguageToggle />
            <Link href="/">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3"
              >
                <ArrowLeft className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">{t("map.backToChat")}</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Map Content */}
      <div className="max-w-7xl mx-auto p-2 md:p-4">
        {/* Map Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-6">
          <IceActivityMap />
        </div>
      </div>
    </div>
  )
}
