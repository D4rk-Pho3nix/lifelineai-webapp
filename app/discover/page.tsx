"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { CenterList } from "@/components/CenterList";
import { Navigation } from "lucide-react";
import dynamic from "next/dynamic";

const DiscoverMap = dynamic(
  () => import("@/components/DiscoverMap"),
  { ssr: false }
);

export default function DiscoverPage() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [centers, setCenters] = useState<any[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          const accuracy = position.coords.accuracy;

          setUserLocation({
            lat: latitude,
            lng: longitude,
            accuracy: accuracy
          });
          setLocationError(null);
        },
        (error) => {
          console.error("Location error:", error);
          alert("Please allow location access to find nearby mental health centers.");
          setLocationError("Please allow location access to find nearby mental health centers.");
          setIsLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0
        }
      );
    } else {
      setLocationError("Please allow location access to find nearby mental health centers.");
      setIsLoading(false);
    }
  }, []);

  // Fetch Nearby Places via Overpass API
  useEffect(() => {
    if (!userLocation) return;

    setIsLoading(true);

    const lat = userLocation.lat;
    const lng = userLocation.lng;

    // Overpass QL to find mental health centers / clinics
    const query = `
      [out:json];
      (
        node["amenity"="hospital"](around:5000, ${lat}, ${lng});
        node["amenity"="clinic"](around:5000, ${lat}, ${lng});
        node["healthcare"="psychiatrist"](around:5000, ${lat}, ${lng});
        node["healthcare"="psychotherapist"](around:5000, ${lat}, ${lng});
        node["healthcare"="mental_health"](around:5000, ${lat}, ${lng});
      );
      out body;
    `;

    fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query
    })
    .then(res => res.json())
    .then(data => {
      if (data && data.elements) {
        const filtered = data.elements.filter(
          (place: any) => place.tags && place.tags.name
        );

        let results = filtered.map((r: any) => {
           const lat2 = r.lat;
           const lon2 = r.lon;
           
           // Simple Haversine distance
           const R = 6371; // km
           const dLat = (lat2 - lat) * (Math.PI/180);
           const dLon = (lon2 - lng) * (Math.PI/180); 
           const a = 
             Math.sin(dLat/2) * Math.sin(dLat/2) +
             Math.cos(lat * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * 
             Math.sin(dLon/2) * Math.sin(dLon/2); 
           const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
           const d = R * c; 
           
           const tags = r.tags || {};
           const name = tags.name || "Mental Health Clinic";
           const phone =
             tags.phone ||
             tags["contact:phone"] ||
             tags["phone:mobile"] ||
             "Not Available";
           
           const address = [
             tags["addr:housenumber"],
             tags["addr:street"],
             tags["addr:city"],
             tags["addr:postcode"],
           ].filter(Boolean).join(", ") || "Address not available";

           return {
             id: r.id.toString(),
             place_id: r.id.toString(),
             name,
             lat: lat2,
             lon: lon2,
             formatted_address: address,
             vicinity: address,
             formatted_phone_number: phone,
             distanceText: `${d.toFixed(1)} km`,
             distanceValue: d
           };
        });

        // Ensure unique results by id
        const uniqueResultsMap = new Map();
        results.forEach((r: any) => {
          if (!uniqueResultsMap.has(r.id)) {
            uniqueResultsMap.set(r.id, r);
          }
        });
        results = Array.from(uniqueResultsMap.values());

        // Sort by closest distance and limit to 10
        results = results.sort((a: any, b: any) => a.distanceValue - b.distanceValue).slice(0, 10);
        setCenters(results);
      } else {
        setCenters([]);
      }
    })
    .catch(err => {
      console.error("Error fetching places via Overpass API:", err);
      setCenters([]);
    })
    .finally(() => {
      setIsLoading(false);
    });

  }, [userLocation]);

  const handleMarkerClick = useCallback((id: string) => {
    const el = document.getElementById(`center-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-primary/20', 'scale-[1.02]', 'ring-2', 'ring-primary/50');
      setTimeout(() => {
         el.classList.remove('bg-primary/20', 'scale-[1.02]', 'ring-2', 'ring-primary/50');
      }, 1500);
    }
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden relative">
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-5xl mx-auto w-full">
        {/* Header Text */}
        <div className="space-y-1.5 pt-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Nearby Mental Health Centers</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Find professional help, therapy clinics, and support facilities in your area.</p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-card p-4 rounded-xl border shadow-sm mt-8">
          {locationError ? (
            <div className="flex items-center gap-2.5 text-sm font-medium text-destructive px-3 py-2 bg-destructive/10 rounded-lg">
              <span>{locationError}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 text-sm font-medium text-foreground px-3 py-2 bg-muted/50 rounded-lg">
               <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
               <Navigation className="w-4 h-4 text-primary" />
               <span>Using current location</span>
            </div>
          )}
        </div>

        {/* Map Section */}
        <section className="relative w-full shadow-sm rounded-2xl border bg-card p-1">
          <div className="w-full h-[320px] rounded-[12px] overflow-hidden">
            <DiscoverMap 
              centers={centers}
              userLocation={userLocation}
              hoveredId={hoveredId}
              onMarkerClick={handleMarkerClick}
            />
          </div>
        </section>

        {/* Results List */}
        <section className="pb-12 pt-4">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-foreground">
               Nearby Mental Health Centers
            </h2>
          </div>
          
          {!isLoading && centers.length === 0 && !locationError ? (
            <div className="text-center p-6 text-muted-foreground bg-card rounded-xl border">
              No nearby mental health centers found within 5km.
            </div>
          ) : (
            <CenterList 
               centers={centers}
               hoveredId={hoveredId}
               onHover={setHoveredId}
               onClickToggle={handleMarkerClick}
               isLoading={isLoading}
            />
          )}
        </section>
      </div>
    </div>
  );
}
