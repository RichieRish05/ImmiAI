"use client";

import { useState } from "react";
import AsyncSelect from "react-select/async";
import axios from "axios";
import { Button } from "@/components/ui/button";

export default function ReportModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [selectedCity, setSelectedCity] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [description, setDescription] = useState("");

  const loadCities = async (inputValue: string) => {
    if (!inputValue) return [];

    const res = await axios.get(
      "https://wft-geo-db.p.rapidapi.com/v1/geo/cities",
      {
        headers: {
          "X-RapidAPI-Key": process.env.NEXT_PUBLIC_RAPIDAPI_KEY, // from .env
          "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com",
        },
        params: {
          namePrefix: inputValue,
          limit: 5,
          countryIds: "US",
        },
      }
    );

    return res.data.data.map((city: any) => ({
      value: `${city.latitude},${city.longitude}`,
      label: `${city.city}, ${city.regionCode}`,
    }));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl space-y-4 z-[1000]">
        <h2 className="text-lg font-semibold">Report a Location</h2>

        <AsyncSelect
          cacheOptions
          loadOptions={loadCities}
          defaultOptions
          onChange={setSelectedCity}
          placeholder="Start typing a city..."
          isClearable
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the incident..."
          className="w-full border border-gray-300 rounded px-3 py-2"
        />

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (!selectedCity) return alert("Please select a city.");

              const [lat, lon] = selectedCity.value.split(",");
              const payload = {
                lat: parseFloat(lat),
                lon: parseFloat(lon),
                city: selectedCity.label.split(",")[0],
                date: new Date().toISOString().split("T")[0], // format: YYYY-MM-DD
                description: description,
              };

              try {
                const res = await fetch("/api/report", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(payload),
                });

                if (!res.ok) throw new Error("Failed to submit report");

                setSelectedCity(null);
                setDescription("");
                onClose();
              } catch (err) {
                console.error(err);
                alert("There was an error submitting the report.");
              }
            }}
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
