"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Fix for Leaflet marker icons in Next.js
import L from "leaflet"
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

// Dynamically import the map to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false })

// Sample ICE raid data
const iceRaids = [
  {
    id: 1,
    lat: 40.7128,
    lng: -74.006,
    location: "New York, NY",
    date: "2024-01-15",
    description:
      "ICE operation targeting undocumented workers at multiple locations in Manhattan. Approximately 25 individuals detained during early morning raids at residential buildings.",
    detainees: 25,
    type: "Residential",
  },
  {
    id: 2,
    lat: 34.0522,
    lng: -118.2437,
    location: "Los Angeles, CA",
    date: "2024-01-20",
    description:
      "Workplace enforcement action at several businesses in downtown LA. ICE agents conducted audits and detained workers without proper documentation.",
    detainees: 18,
    type: "Workplace",
  },
  {
    id: 3,
    lat: 41.8781,
    lng: -87.6298,
    location: "Chicago, IL",
    date: "2024-01-25",
    description:
      "Coordinated operation across multiple neighborhoods on the South Side. Raids focused on individuals with prior deportation orders.",
    detainees: 32,
    type: "Targeted",
  },
  {
    id: 4,
    lat: 29.7604,
    lng: -95.3698,
    location: "Houston, TX",
    date: "2024-02-01",
    description:
      "Large-scale operation in industrial district targeting construction and manufacturing workers. Multiple businesses raided simultaneously.",
    detainees: 45,
    type: "Workplace",
  },
  {
    id: 5,
    lat: 33.4484,
    lng: -112.074,
    location: "Phoenix, AZ",
    date: "2024-02-05",
    description:
      "Residential raids in suburban neighborhoods. ICE agents executed warrants at private homes during early morning hours.",
    detainees: 12,
    type: "Residential",
  },
  {
    id: 6,
    lat: 25.7617,
    lng: -80.1918,
    location: "Miami, FL",
    date: "2024-02-10",
    description:
      "Operation at agricultural facilities in Miami-Dade County. Focus on seasonal workers in farming operations.",
    detainees: 28,
    type: "Agricultural",
  },
]

export default function IceRaidMap() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <Card className="w-full h-[400px]">
        <CardHeader>
          <CardTitle>ICE Raids Map</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-muted-foreground">Loading map...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>ICE Raids Map</CardTitle>
          <p className="text-sm text-muted-foreground">Click on any marker to view details about the raid</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[525px] w-full">
            <MapContainer
              center={[39.8283, -98.5795]} // Center of US
              zoom={4}
              style={{ height: "100%", width: "100%" }}
              className="rounded-b-lg"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {iceRaids.map((raid) => (
                <Marker key={raid.id} position={[raid.lat, raid.lng]}>
                  <Popup maxWidth={300} className="custom-popup">
                    <div className="space-y-2">
                      <div className="font-semibold text-lg">{raid.location}</div>
                      <div className="text-sm text-gray-600">
                        <strong>Date:</strong> {new Date(raid.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Type:</strong> {raid.type}
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Detainees:</strong> {raid.detainees}
                      </div>
                      <div className="text-sm mt-2">
                        <strong>Description:</strong>
                        <p className="mt-1">{raid.description}</p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle>Raid Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{iceRaids.length}</div>
              <div className="text-sm text-muted-foreground">Total Raids</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{iceRaids.reduce((sum, raid) => sum + raid.detainees, 0)}</div>
              <div className="text-sm text-muted-foreground">Total Detainees</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{new Set(iceRaids.map((raid) => raid.type)).size}</div>
              <div className="text-sm text-muted-foreground">Raid Types</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {Math.round(iceRaids.reduce((sum, raid) => sum + raid.detainees, 0) / iceRaids.length)}
              </div>
              <div className="text-sm text-muted-foreground">Avg per Raid</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
