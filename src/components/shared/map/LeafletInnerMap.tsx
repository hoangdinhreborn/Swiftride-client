"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import type { LatLng } from "@/lib/map/haversine";
import type { NearbyDriverDto } from "@/types";
import { routingService } from "@/services/routing.service";

const GOONG_MAP_KEY = process.env.NEXT_PUBLIC_GOONG_MAP_KEY;

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
    A
  </div>
`);

const destinationIcon = createDivIcon(`
  <div style="background-color: #EF4444; border: 2px solid #0F172A; width: 30px; height: 30px; border-radius: 6px; box-shadow: 2px 2px 0px #0F172A; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">
    B
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
  routeCoordinates,
}: {
  pickup?: LatLng | null;
  destination?: LatLng | null;
  driver?: LatLng | null;
  routeCoordinates?: [number, number][];
}) {
  const map = useMap();

  useEffect(() => {
    if (routeCoordinates && routeCoordinates.length >= 2) {
      const bounds = L.latLngBounds(routeCoordinates);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      return;
    }

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
  }, [pickup, destination, driver, routeCoordinates, map]);

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
  const [roadCoordinates, setRoadCoordinates] = useState<[number, number][]>([]);
  const [routeStats, setRouteStats] = useState<{ distanceKm: number; durationMin: number } | null>(null);

  // Tự động phân tích và lấy tuyến đường lái xe uốn lượn thực tế từ OSRM
  useEffect(() => {
    if (!pickup || !destination) {
      setRoadCoordinates([]);
      setRouteStats(null);
      return;
    }

    let isMounted = true;
    routingService.getRoute(pickup, destination).then((route) => {
      if (!isMounted) return;
      if (route && route.coordinates.length > 0) {
        setRoadCoordinates(route.coordinates);
        if (route.distanceMeters > 0) {
          setRouteStats({
            distanceKm: Math.round((route.distanceMeters / 1000) * 10) / 10,
            durationMin: Math.max(1, Math.round(route.durationSeconds / 60)),
          });
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [pickup?.lat, pickup?.lng, destination?.lat, destination?.lng]);

  const tileUrl = GOONG_MAP_KEY
    ? `https://tiles.goong.io/{z}/{x}/{y}.png?api_key=${GOONG_MAP_KEY}`
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const attribution = GOONG_MAP_KEY
    ? '&copy; <a href="https://goong.io/">Goong.io</a> Maps'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  return (
    <div className="relative h-full w-full overflow-hidden border-2 border-pixel-border">
      {/* Provider badge */}
      <div className="absolute top-3 right-3 z-[1000] rounded border-2 border-pixel-border bg-white/95 px-2.5 py-1 text-[11px] font-mono font-bold shadow-pixel-sm">
        {GOONG_MAP_KEY ? "🗺️ Bản đồ Goong.io" : "🗺️ OpenStreetMap + OSRM"}
      </div>

      {/* Thông tin lộ trình thực tế OSRM */}
      {routeStats && (
        <div className="absolute bottom-4 left-4 z-[1000] rounded border-2 border-pixel-border bg-white px-3 py-1.5 shadow-pixel text-xs font-mono font-bold flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse" />
          <span>Tuyến đường OSRM: {routeStats.distanceKm} km (~{routeStats.durationMin} phút lái xe)</span>
        </div>
      )}

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
        <TileLayer attribution={attribution} url={tileUrl} />

        <MapEventsHandler onSelect={onSelectLocation} />
        <MapBoundsUpdater
          pickup={pickup}
          destination={destination}
          driver={driverLocation}
          routeCoordinates={roadCoordinates}
        />

        {/* Marker Điểm đón */}
        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
            <Popup>
              <div className="text-xs font-bold text-emerald-800">Điểm Đón (A)</div>
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
              <div className="text-xs font-bold text-rose-800">Điểm Đến (B)</div>
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

        {/* Tuyến đường uốn lượn thực tế từ OSRM (Viền đen + Lớp xanh công nghệ) */}
        {roadCoordinates.length >= 2 && (
          <>
            {/* Viền ngoài */}
            <Polyline
              positions={roadCoordinates}
              color="#0F172A"
              weight={7}
              opacity={0.8}
            />
            {/* Lớp xanh chính */}
            <Polyline
              positions={roadCoordinates}
              color="#2563EB"
              weight={5}
              opacity={0.95}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}
