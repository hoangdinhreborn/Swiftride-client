"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import type { LatLng } from "@/lib/map/haversine";
import type { NearbyDriverDto } from "@/types";

// Custom SVG Icons
function createDivIcon(svgHtml: string, className = "", size: [number, number] = [32, 32]) {
  return L.divIcon({
    html: svgHtml,
    className: `custom-pixel-marker ${className}`,
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1]],
    popupAnchor: [0, -size[1]],
  });
}

const pickupIcon = createDivIcon(`
  <div style="background-color: #10B981; border: 2px solid #0F172A; width: 30px; height: 30px; border-radius: 6px; box-shadow: 2px 2px 0px #0F172A; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">
    P
  </div>
`);

const destinationIcon = createDivIcon(`
  <div style="background-color: #EF4444; border: 2px solid #0F172A; width: 30px; height: 30px; border-radius: 6px; box-shadow: 2px 2px 0px #0F172A; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">
    D
  </div>
`);

const driverIcon = createDivIcon(
  `
  <div style="background-color: #F59E0B; border: 2px solid #0F172A; width: 34px; height: 34px; border-radius: 6px; box-shadow: 3px 3px 0px #0F172A; display: flex; align-items: center; justify-content: center; font-size: 18px;">
    🚕
  </div>
`,
  "driver-cab",
  [34, 34]
);

const nearbyDriverIcon = createDivIcon(
  `
  <div style="background-color: #FEF08A; border: 2px solid #0F172A; width: 26px; height: 26px; border-radius: 4px; box-shadow: 2px 2px 0px #0F172A; display: flex; align-items: center; justify-content: center; font-size: 14px;">
    🚗
  </div>
`,
  "nearby-driver",
  [26, 26]
);

interface LeafletMapProps {
  center?: LatLng;
  zoom?: number;
  pickup?: LatLng | null;
  destination?: LatLng | null;
  driverLocation?: LatLng | null;
  nearbyDrivers?: NearbyDriverDto[];
  onSelectLocation?: (pos: LatLng) => void;
  selectionMode?: "pickup" | "destination" | null;
}

function MapEventsHandler({ onSelect }: { onSelect?: (pos: LatLng) => void }) {
  useMapEvents({
    click(e) {
      if (onSelect) {
        onSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
}

function MapBoundsUpdater({
  pickup,
  destination,
  driver,
}: {
  pickup?: LatLng | null;
  destination?: LatLng | null;
  driver?: LatLng | null;
}) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [];
    if (pickup) points.push([pickup.lat, pickup.lng]);
    if (destination) points.push([destination.lat, destination.lng]);
    if (driver) points.push([driver.lat, driver.lng]);

    if (points.length >= 2) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    } else if (points.length === 1) {
      map.setView(points[0], 14);
    }
  }, [pickup, destination, driver, map]);

  return null;
}

export default function LeafletInnerMap({
  center = { lat: 10.7721, lng: 106.698 }, // Mặc định TP. Hồ Chí Minh
  zoom = 13,
  pickup,
  destination,
  driverLocation,
  nearbyDrivers = [],
  onSelectLocation,
  selectionMode,
}: LeafletMapProps) {
  const routePoints: [number, number][] = [];
  if (pickup) routePoints.push([pickup.lat, pickup.lng]);
  if (destination) routePoints.push([destination.lat, destination.lng]);

  return (
    <div className="relative h-full w-full overflow-hidden border-2 border-pixel-border">
      {/* Banner chế độ chọn vị trí */}
      {selectionMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] rounded border-2 border-pixel-border bg-white px-3 py-1.5 shadow-pixel text-xs font-bold font-mono">
          {selectionMode === "pickup" ? (
            <span className="text-emerald-700">📍 Bấm vào bản đồ để chọn ĐIỂM ĐÓN</span>
          ) : (
            <span className="text-rose-700">🎯 Bấm vào bản đồ để chọn ĐIỂM ĐẾN</span>
          )}
        </div>
      )}

      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapEventsHandler onSelect={onSelectLocation} />
        <MapBoundsUpdater pickup={pickup} destination={destination} driver={driverLocation} />

        {/* Marker Điểm đón */}
        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
            <Popup>
              <div className="text-xs font-bold text-emerald-800">Điểm Đón (Pickup)</div>
              <div className="text-[11px] text-slate-500 font-mono">
                {pickup.lat.toFixed(4)}, {pickup.lng.toFixed(4)}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marker Điểm đến */}
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
            <Popup>
              <div className="text-xs font-bold text-rose-800">Điểm Đến (Destination)</div>
              <div className="text-[11px] text-slate-500 font-mono">
                {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marker Xe tài xế hiện tại */}
        {driverLocation && (
          <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
            <Popup>
              <div className="text-xs font-bold text-amber-900">Vị trí Tài xế</div>
              <div className="text-[11px] text-slate-500">Đang di chuyển</div>
            </Popup>
          </Marker>
        )}

        {/* Marker Các tài xế lân cận */}
        {nearbyDrivers.map((d) => (
          <Marker
            key={d.driverId}
            position={[d.latitude, d.longitude]}
            icon={nearbyDriverIcon}
          >
            <Popup>
              <div className="text-xs font-bold text-slate-800">Tài xế sẵn sàng</div>
              <div className="text-[11px] text-slate-500">
                Cách: {d.distanceKm.toFixed(2)} km
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Polyline đường đi */}
        {routePoints.length === 2 && (
          <Polyline
            positions={routePoints}
            color="#0F172A"
            weight={4}
            dashArray="6, 8"
            opacity={0.8}
          />
        )}
      </MapContainer>
    </div>
  );
}
