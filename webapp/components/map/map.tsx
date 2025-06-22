"use client"

import { useEffect, useState, useRef } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import ReportModal from "./report-modal"
import L from "leaflet"
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false })
const ZoomControl = dynamic(() => import("react-leaflet").then((mod) => mod.ZoomControl), { ssr: false })

const iceRaids = [
  { id: 1, lat: 40.7128, lng: -74.006, location: "New York, NY", date: "2024-01-15", description: "ICE operation targeting undocumented workers at multiple locations in Manhattan. Approximately 25 individuals detained during early morning raids at residential buildings.", detainees: 25, type: "Residential" },
  { id: 2, lat: 34.0522, lng: -118.2437, location: "Los Angeles, CA", date: "2024-01-20", description: "Workplace enforcement action at several businesses in downtown LA. ICE agents conducted audits and detained workers without proper documentation.", detainees: 18, type: "Workplace" },
  { id: 3, lat: 41.8781, lng: -87.6298, location: "Chicago, IL", date: "2024-01-25", description: "Coordinated operation across multiple neighborhoods on the South Side. Raids focused on individuals with prior deportation orders.", detainees: 32, type: "Targeted" },
  { id: 4, lat: 29.7604, lng: -95.3698, location: "Houston, TX", date: "2024-02-01", description: "Large-scale operation in industrial district targeting construction and manufacturing workers. Multiple businesses raided simultaneously.", detainees: 45, type: "Workplace" },
  { id: 5, lat: 33.4484, lng: -112.074, location: "Phoenix, AZ", date: "2024-02-05", description: "Residential raids in suburban neighborhoods. ICE agents executed warrants at private homes during early morning hours.", detainees: 12, type: "Residential" },
  { id: 6, lat: 25.7617, lng: -80.1918, location: "Miami, FL", date: "2024-02-10", description: "Operation at agricultural facilities in Miami-Dade County. Focus on seasonal workers in farming operations.", detainees: 28, type: "Agricultural" },
]

export default function IceRaidMap() {
  const [isClient, setIsClient] = useState(false)
  const [search, setSearch] = useState("")
  const [filteredRaids, setFilteredRaids] = useState(iceRaids)
  const [modalOpen, setModalOpen] = useState(false)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (search) {
      const results = iceRaids.filter((raid) => raid.location.toLowerCase().includes(search.toLowerCase()))
      setFilteredRaids(results)
    } else {
      setFilteredRaids(iceRaids)
    }
  }, [search])

  const handleLocationClick = (raid: any) => {
    if (mapRef.current) {
      mapRef.current.setView([raid.lat, raid.lng], 12)
    }
    setSearch("")
    setFilteredRaids(iceRaids)
    console.log("Clicked on:", raid.location)
  }

  if (!isClient) {
    return (
      <Card className="w-full h-[600px]">
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
    <div className="w-full space-y-4 relative z-50">
      <ReportModal open={modalOpen} onClose={() => setModalOpen(false)} />

      <Card className="relative overflow-visible z-10">
        <CardHeader className="space-y-4 relative">
          <div>
            <CardTitle className="text-2xl">ICE Raids Map</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Click on any marker to view details about the raid</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
              <Input
                type="text"
                placeholder="Search for a location..."
                className="pl-10 relative"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => setModalOpen(true)}>
              Report Location
            </Button>
          </div>
        </CardHeader>

        {search && filteredRaids.length > 0 && (
          <div className="absolute top-36 left-6 right-6 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto z-[1000] divide-y divide-gray-100">
            <div className="px-4 py-2 text-sm text-gray-500 bg-gray-50 rounded-t-lg">
              {filteredRaids.length} result{filteredRaids.length !== 1 ? "s" : ""} found
            </div>
            {filteredRaids.map((raid) => (
              <div
                key={raid.id}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150 ease-in-out"
                onClick={() => handleLocationClick(raid)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">{raid.location}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(raid.date).toLocaleDateString()} • {raid.type} • {raid.detainees} detainees
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <CardContent className="p-0">
          <div className="h-[600px] w-full">
            <MapContainer
              center={[39.8283, -98.5795]}
              zoom={4}
              style={{ height: "100%", width: "100%" }}
              className="rounded-b-lg z-0"
              ref={mapRef}
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ZoomControl position="bottomright" />
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
    </div>
  )
}
