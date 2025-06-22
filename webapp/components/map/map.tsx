// webapp/components/map/map.tsx
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

// Only load Leaflet on the client
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

// Dynamically import react-leaflet
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
};

export default function IceRaidMap() {
  const [isClient, setIsClient] = useState(false);
  const [raids, setRaids] = useState<Raid[]>([]);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState<Raid[]>([]);

  // on mount: mark client and fetch
  useEffect(() => {
    setIsClient(true);
    fetch("http://localhost:8000/raids")
      .then((r) => r.json())
      .then((data: Raid[]) => {
        setRaids(data);
        setFiltered(data);
      })
      .catch(console.error);
  }, []);

  // filter by city
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

  if (isClient && raids.length === 0) {
    return (
      <Card className="w-full h-[600px]">
        <CardHeader>
          <CardTitle>ICE Raids Map</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-full">
          Fetching reports… please wait
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4">
      <Card className="relative overflow-visible">
        <CardHeader className="space-y-4 relative z-10">
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
        </CardHeader>

        <CardContent className="p-0">
          <div className="h-[600px] w-full">
            <MapContainer
              center={[39.8283, -98.5795]}
              zoom={4}
              style={{ height: "100%", width: "100%" }}
              zoomControl={false}
              className="rounded-b-lg"
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
