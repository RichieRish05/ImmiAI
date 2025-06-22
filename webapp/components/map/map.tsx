// webapp/components/map/map.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ReportModal from "./report-modal";
import SmartPromptModal from "./smart-prompt-modal";
import type { Map as LeafletMap } from "leaflet";
import { useRouter } from "next/navigation";

let L: any = null;
if (typeof window !== "undefined") {
  // @ts-ignore
  L = require("leaflet");
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
}

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});
const ZoomControl = dynamic(
  () => import("react-leaflet").then((mod) => mod.ZoomControl),
  { ssr: false }
);

type Raid = {
  id: number;
  lat: number | null;
  lon: number | null;
  city: string | null;
  date: string;
  description?: string | null;
};

export default function IceRaidMap() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [raids, setRaids] = useState<Raid[]>([]);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState<Raid[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [smartPromptOpen, setSmartPromptOpen] = useState(false);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    setIsClient(true);
    const fetchAllReports = async () => {
      try {
        const [fastapiRes, mongoRes] = await Promise.all([
          fetch("http://localhost:8000/raids"),
          fetch("/api/report"),
        ]);

        const [fastapiData, mongoData] = await Promise.all([
          fastapiRes.json(),
          mongoRes.json(),
        ]);

        const combined = [...fastapiData, ...mongoData];
        setRaids(combined);
        setFiltered(combined);
      } catch (err) {
        console.error("Error fetching reports:", err);
      }
    };

    fetchAllReports();
  }, []);

  useEffect(() => {
    if (search) {
      setFiltered(
        raids.filter((r) =>
          r.city?.toLowerCase().includes(search.toLowerCase())
        )
      );
    } else {
      setFiltered(raids);
    }
  }, [search, raids]);

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 12);
        }

        const nearby = raids.some((r) => {
          if (r.lat && r.lon) {
            const dist = Math.sqrt(
              Math.pow(r.lat - latitude, 2) + Math.pow(r.lon - longitude, 2)
            );
            return dist < 1.0; // ~within 100km
          }
          return false;
        });

        if (nearby) {
          setSmartPromptOpen(true);
        }
      },
      () => {
        alert("Unable to retrieve your location.");
      }
    );
  };

  if (!isClient) {
    return (
      <Card className="w-full h-[600px]">
        <CardHeader>
          <CardTitle>ICE Raids Map</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-full">
          Loading map…
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4">
      <ReportModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <SmartPromptModal
        open={smartPromptOpen}
        onClose={() => setSmartPromptOpen(false)}
        onOpenChatbot={() => {
          setSmartPromptOpen(false);
          router.push(
            "/?prefill=What%20are%20my%20rights%20during%20an%20ICE%20encounter%3F"
          );

          console.log("Chatbot opened");
        }}
        onUploadDocs={() => {
          setSmartPromptOpen(false);
          console.log("Upload docs clicked");
        }}
      />
      <Card className="relative overflow-visible">
        <CardHeader className="space-y-4 relative z-20 bg-white">
          <div>
            <CardTitle className="text-2xl">ICE Raids Map</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Click a pin to see date & city
            </p>
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
            <Input
              placeholder="Search by city…"
              className="pl-10 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleGeolocation}>
              Activity Near Me
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(true)}
            >
              Report Location
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="h-[600px] w-full">
            <MapContainer
              center={[39.8283, -98.5795]}
              zoom={4}
              zoomControl={false}
              className="rounded-b-lg z-0"
              style={{ height: "100%", width: "100%" }}
              ref={(mapInstance) => {
                if (mapInstance) {
                  mapRef.current = mapInstance;
                }
              }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ZoomControl position="bottomright" />
              {filtered.map((r) =>
                r.lat !== null && r.lon !== null ? (
                  <Marker
                    key={r.id}
                    position={[r.lat as number, r.lon as number]}
                  >
                    <Popup>
                      <strong>{r.city}</strong>
                      <br />
                      {new Date(r.date).toLocaleDateString()}
                      {r.description && (
                        <>
                          <hr className="my-2" />
                          <p className="text-sm text-gray-700 whitespace-pre-line">
                            Description: {r.description}
                          </p>
                        </>
                      )}
                    </Popup>
                  </Marker>
                ) : null
              )}
            </MapContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
