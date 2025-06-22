"use client"

import IceRaidMap from "@/components/map/map"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function MapPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Chat
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">ICE Raids Map</h1>
              <p className="text-sm text-gray-600">Track reported ICE enforcement activities</p>
            </div>
          </div>
        </div>
      </div>

      {/* Map Content */}
      <div className="max-w-7xl mx-auto p-4">
        <IceRaidMap />
      </div>
    </div>
  )
} 