"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { CenterList } from "@/components/CenterList";
import { Navigation } from "lucide-react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChatSidebar } from "@/components/chat-sidebar";
import type { ChatSession } from "@/app/page";

const DiscoverMap = dynamic(
  () => import("@/components/DiscoverMap"),
  { ssr: false }
);

export default function DiscoverPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [rawPlaces, setRawPlaces] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Load chat sessions from localStorage to hydrate sidebar
  useEffect(() => {
    const savedSessions = localStorage.getItem("chat-sessions");
    if (savedSessions) {
      try {
        const parsedSessions = JSON.parse(savedSessions).map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
          messages: s.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
        }));
        setChatSessions(parsedSessions);
      } catch (error) {
        console.error("Failed to parse stored sessions:", error);
      }
    }
  }, []);

  // Helper function to calculate distance in km
  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    let watchId: number;

    if (typeof window !== "undefined" && "geolocation" in navigator) {
      // Use watchPosition to get the most accurate location over time
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          const accuracy = position.coords.accuracy;

          setUserLocation({ lat: latitude, lng: longitude, accuracy });
          setLocationError(null);

          // Update searchLocation only if it is null or user has moved more than 2km
          setSearchLocation((prev) => {
            if (!prev) return { lat: latitude, lng: longitude };
            const distance = getDistanceKm(prev.lat, prev.lng, latitude, longitude);
            if (distance > 2) {
              return { lat: latitude, lng: longitude };
            }
            return prev;
          });
        },
        (error) => {
          console.error("Location error:", error);
          setLocationError("Please allow location access to find nearby mental health centers.");
          setIsLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setLocationError("Please allow location access to find nearby mental health centers.");
      setIsLoading(false);
    }

    return () => {
      if (watchId !== undefined && typeof window !== "undefined" && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Fetch Nearby Places via Overpass API when searchLocation changes
  useEffect(() => {
    if (!searchLocation) return;

    setIsLoading(true);

    const lat = searchLocation.lat;
    const lng = searchLocation.lng;

    // Overpass QL to find mental health centers / clinics within 10km radius
    const query = `
      [out:json];
      (
        node["amenity"="hospital"](around:10000, ${lat}, ${lng});
        node["amenity"="clinic"](around:10000, ${lat}, ${lng});
        node["healthcare"="psychiatrist"](around:10000, ${lat}, ${lng});
        node["healthcare"="psychotherapist"](around:10000, ${lat}, ${lng});
        node["healthcare"="mental_health"](around:10000, ${lat}, ${lng});
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
        setRawPlaces(filtered);
      } else {
        setRawPlaces([]);
      }
    })
    .catch(err => {
      console.error("Error fetching places via Overpass API:", err);
      setRawPlaces([]);
    })
    .finally(() => {
      setIsLoading(false);
    });

  }, [searchLocation]);

  // Update center calculations whenever userLocation or rawPlaces change
  useEffect(() => {
    if (!userLocation || rawPlaces.length === 0) {
       // If no places but we finished loading, empty the centers
       if (!isLoading && rawPlaces.length === 0) {
         setCenters([]);
       }
       return;
    }

    const { lat, lng } = userLocation;

    let results = rawPlaces.map((r: any) => {
       const lat2 = r.lat;
       const lon2 = r.lon;
       
       const d = getDistanceKm(lat, lng, lat2, lon2);
       
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

    // Ensure unique results by id and rigidly filter everything > 10km
    const uniqueResultsMap = new Map();
    results.forEach((r: any) => {
      if (!uniqueResultsMap.has(r.id) && r.distanceValue <= 10) {
        uniqueResultsMap.set(r.id, r);
      }
    });
    results = Array.from(uniqueResultsMap.values());

    // Sort by closest distance and limit to 10
    results = results.sort((a: any, b: any) => a.distanceValue - b.distanceValue).slice(0, 10);
    setCenters(results);
  }, [userLocation, rawPlaces, isLoading]);

  const handleMarkerClick = useCallback((id: string) => {
    const el = document.getElementById(`center-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('!border-[#10b981]', 'bg-[rgba(255,255,255,0.03)]');
      setTimeout(() => {
         el.classList.remove('!border-[#10b981]', 'bg-[rgba(255,255,255,0.03)]');
      }, 1500);
    }
    setSelectedCenterId(id);
  }, []);

  const handleCardClick = useCallback((id: string) => {
    const mapEl = document.getElementById('discover-map-section');
    if (mapEl) {
      mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Provide a visual outline on the card natively
    const el = document.getElementById(`center-${id}`);
    if (el) {
      el.classList.add('!border-[#10b981]', 'bg-[rgba(255,255,255,0.03)]');
      setTimeout(() => {
         el.classList.remove('!border-[#10b981]', 'bg-[rgba(255,255,255,0.03)]');
      }, 1500);
    }
    setSelectedCenterId(id);
  }, []);

  const filteredSessions = chatSessions
    .filter(
      (s) =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.messages.some((msg) => msg.content.toLowerCase().includes(searchQuery.toLowerCase())),
    )
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  if (status === "unauthenticated" || !session) {
    if (typeof window !== "undefined") {
      router.push("/login");
    }
    return null;
  }

  return (
    <div className="app-layout flex w-full min-h-screen bg-background relative">
      {/* Sidebar Navigation */}
      <div className="sidebar w-64 min-w-64 max-w-64 flex-shrink-0 h-screen border-r border-border fixed left-0 top-0 overflow-y-auto overflow-x-hidden z-20">
        <ChatSidebar
          sessions={filteredSessions}
          currentSessionId={null}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSessionSelect={(id) => router.push("/")}
          onNewChat={() => router.push("/")}
          onRenameSession={() => {}}
          onDeleteSession={() => {}}
          onToggleBookmark={() => {}}
          session={session}
        />
      </div>

      {/* Main Discover Page Content Area */}
      <main className="content-area flex-1 flex flex-col p-6 bg-background relative w-[calc(100%-16rem)] ml-64 min-h-screen">
        <div className="w-full max-w-5xl mx-auto space-y-6">
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
          <section id="discover-map-section" className="relative w-full shadow-sm rounded-2xl border bg-card p-1">
            <div className="w-full h-[320px] rounded-[12px] overflow-hidden">
              <DiscoverMap 
                centers={centers}
                userLocation={userLocation}
                hoveredId={hoveredId}
                selectedCenterId={selectedCenterId}
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
                 onClickToggle={handleCardClick}
                 isLoading={isLoading}
              />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
