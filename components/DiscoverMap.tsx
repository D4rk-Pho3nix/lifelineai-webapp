"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "next-themes";

// Fix leaflet icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface DiscoverMapProps {
  centers: any[];
  userLocation: { lat: number; lng: number; accuracy: number } | null;
  hoveredId: string | null;
  selectedCenterId?: string | null;
  onMarkerClick: (id: string) => void;
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lng], 15);
  }, [lat, lng, map]);

  return null;
}

function MapController({ 
  selectedCenterId, 
  centers, 
  markerRefs 
}: { 
  selectedCenterId: string | null; 
  centers: any[]; 
  markerRefs: React.MutableRefObject<{ [key: string]: L.Marker | null }>;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedCenterId) {
      const center = centers.find((c: any) => (c.id || c.place_id) === selectedCenterId);
      if (center) {
        map.setView([center.lat, center.lon], 16, { animate: true, duration: 1.5 });
        const marker = markerRefs.current[selectedCenterId];
        if (marker) {
          marker.openPopup();
        }
      }
    }
  }, [selectedCenterId, centers, map, markerRefs]);

  return null;
}

export default function DiscoverMap({ centers, userLocation, hoveredId, selectedCenterId, onMarkerClick }: DiscoverMapProps) {
  const redIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const userIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const markerRefs = useRef<{ [key: string]: L.Marker | null }>({});

  if (typeof window === "undefined") return null;

  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  if (!userLocation) {
    return <div>Detecting your exact location...</div>;
  }

  return (
    <div className={`w-full h-full min-h-[320px] rounded-2xl overflow-hidden bg-muted/30 relative border shadow-sm ${isDarkMode ? 'dark-grey-map' : ''}`} style={{ zIndex: 0 }}>
      {/* Explicit z-index 0 on the parent div to ensure map does not overlap header elements */}
      <style>{`
        .dark-grey-map .leaflet-tile-pane {
          filter: grayscale(0.8) brightness(0.8) contrast(1.2);
        }
      `}</style>
      <MapContainer center={[userLocation.lat, userLocation.lng]} zoom={15} scrollWheelZoom={true} className="w-full h-full absolute inset-0 z-0" style={{ zIndex: 0 }}>
        <RecenterMap lat={userLocation.lat} lng={userLocation.lng} />
        <MapController selectedCenterId={selectedCenterId || null} centers={centers} markerRefs={markerRefs} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} zIndexOffset={1000}>
          <Popup>You are here</Popup>
        </Marker>

        {centers.map((c, idx) => {
          const mId = c.id || c.place_id || idx.toString();
          return (
            <Marker 
              key={mId} 
              position={[c.lat, c.lon]} 
              icon={redIcon}
              ref={(r) => { if (r) markerRefs.current[mId] = r; }}
              eventHandlers={{ click: () => onMarkerClick(mId) }}
            >
            <Popup>
              <div className="font-sans">
                <strong>{c.name}</strong>
                {c.formatted_address && c.formatted_address !== "Address not available" && (
                  <>
                    <br />
                    {c.formatted_address}
                  </>
                )}
                {c.formatted_phone_number && (
                  <>
                    <br />
                    Phone: {c.formatted_phone_number}
                  </>
                )}
              </div>
            </Popup>
          </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
