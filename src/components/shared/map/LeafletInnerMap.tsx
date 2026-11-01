"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import type { LatLng } from "@/lib/map/haversine";
import type { NearbyDriverDto } from "@/types";
import { routingService } from "@/services/routing.service";
import { MapPin, Flag, Navigation, Map as MapIcon, Layers } from "lucide-react";

const GOONG_MAP_KEY = process.env.NEXT_PUBLIC_GOONG_MAP_KEY;

// Các theme bản đồ chất lượng cao không yêu cầu API key (Zero-Config)
const MAP_THEMES = {
  osm: {
    name: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  hot: {
    name: "Giao thông (OSM HOT)",
    url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors, Tiles style by Humanitarian OSM Team",
  },
  esri: {
    name: "Đường phố (ESRI)",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri &copy; OpenStreetMap contributors",
  },
  goong: {
    name: "Goong.io",
    url: `https://tiles.goong.io/assets/goong_light/{z}/{x}/{y}.png?api_key=${GOONG_MAP_KEY}`,
    attribution: "&copy; Goong.io Maps",
  },
};

// Custom SVG Icons sử dụng biểu tượng vector Lucide phẳng, cao cấp
function createDivIcon(svgHtml: string, className = "", size: [number, number] = [32, 32]) {
  return L.divIcon({
    html: svgHtml,
    className: `custom-pixel-marker ${className}`,
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1]],
    popupAnchor: [0, -size[1]],
  });
}

// Marker Điểm đón khách (A)
const pickupIcon = createDivIcon(`
  <div style="background-color: #10B981; border: 2px solid #0F172A; width: 32px; height: 32px; border-radius: 6px; box-shadow: 2px 2px 0px #0F172A; display: flex; align-items: center; justify-content: center;">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  </div>
`);

// Marker Điểm đến (B)
const destinationIcon = createDivIcon(`
  <div style="background-color: #EF4444; border: 2px solid #0F172A; width: 32px; height: 32px; border-radius: 6px; box-shadow: 2px 2px 0px #0F172A; display: flex; align-items: center; justify-content: center;">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" x2="4" y1="22" y2="15"/>
    </svg>
  </div>
`);

// Marker Xe tài xế chính (Lucide Car vector)
const driverIcon = createDivIcon(
  `
  <div style="background-color: #F59E0B; border: 2px solid #0F172A; width: 36px; height: 36px; border-radius: 6px; box-shadow: 3px 3px 0px #0F172A; display: flex; align-items: center; justify-content: center;">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F172A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
      <circle cx="7" cy="17" r="2"/>
      <path d="M9 17h6"/>
      <circle cx="17" cy="17" r="2"/>
    </svg>
  </div>
`,
  "driver-cab",
  [36, 36]
);

// Marker Tài xế lân cận (Lucide Car vector màu vàng rực rỡ + hiệu ứng Radar Pulse nổi bật)
const nearbyDriverIcon = createDivIcon(
  `
  <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
    <div style="position: absolute; width: 36px; height: 36px; background-color: #F59E0B; opacity: 0.4; border-radius: 9999px; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
    <div style="position: relative; background-color: #FEF08A; border: 2px solid #0F172A; width: 32px; height: 32px; border-radius: 6px; box-shadow: 2px 2px 0px #0F172A; display: flex; align-items: center; justify-content: center;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F172A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
        <circle cx="7" cy="17" r="2"/>
        <path d="M9 17h6"/>
        <circle cx="17" cy="17" r="2"/>
      </svg>
    </div>
  </div>
`,
  "nearby-driver",
  [36, 36]
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
  routeFrom?: LatLng | null;
  routeTo?: LatLng | null;
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
  routeFrom,
  routeTo,
}: LeafletMapProps) {
  const [roadCoordinates, setRoadCoordinates] = useState<[number, number][]>([]);
  const [routeStats, setRouteStats] = useState<{ distanceKm: number; durationMin: number } | null>(null);

  // Mặc định: OpenStreetMap (chuẩn bài tập lớn), có thể chuyển sang ESRI hoặc OSM HOT
  const [selectedTheme, setSelectedTheme] = useState<"osm" | "esri" | "hot" | "goong">(
    GOONG_MAP_KEY ? "goong" : "osm"
  );
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  // Xác định điểm bắt đầu và điểm kết thúc của tuyến đường OSRM
  const fromPoint = routeFrom || pickup;
  const toPoint = routeTo || destination;

  // Tự động phân tích và lấy tuyến đường lái xe uốn lượn thực tế từ OSRM
  useEffect(() => {
    if (!fromPoint || !toPoint) {
      setRoadCoordinates([]);
      setRouteStats(null);
      return;
    }

    let isMounted = true;
    routingService.getRoute(fromPoint, toPoint).then((route) => {
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
  }, [fromPoint?.lat, fromPoint?.lng, toPoint?.lat, toPoint?.lng]);

  const activeTheme = MAP_THEMES[selectedTheme];

  return (
    <div className="relative h-full w-full overflow-hidden border-2 border-pixel-border">
      {/* Provider badge & Style Switcher */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="rounded border-2 border-pixel-border bg-white px-2.5 py-1 text-[11px] font-mono font-bold shadow-pixel-sm flex items-center gap-1.5 hover:bg-slate-50"
          >
            <Layers className="h-3.5 w-3.5 text-blue-600" />
            <span>{activeTheme.name}</span>
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 mt-1 w-44 rounded border-2 border-pixel-border bg-white p-1 shadow-pixel z-[1100] text-xs font-mono">
              <button
                type="button"
                onClick={() => {
                  setSelectedTheme("osm");
                  setShowThemeMenu(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between ${
                  selectedTheme === "osm" ? "bg-taxi font-bold" : "hover:bg-slate-100"
                }`}
              >
                <span>OpenStreetMap</span>
                <span className="text-[9px] opacity-70">Gốc</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedTheme("esri");
                  setShowThemeMenu(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between ${
                  selectedTheme === "esri" ? "bg-taxi font-bold" : "hover:bg-slate-100"
                }`}
              >
                <span>Đường phố (ESRI)</span>
                <span className="text-[9px] opacity-70">Sắc nét</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedTheme("hot");
                  setShowThemeMenu(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between ${
                  selectedTheme === "hot" ? "bg-taxi font-bold" : "hover:bg-slate-100"
                }`}
              >
                <span>Giao thông (HOT)</span>
                <span className="text-[9px] opacity-70">Miễn phí</span>
              </button>

              {GOONG_MAP_KEY && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTheme("goong");
                    setShowThemeMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between ${
                    selectedTheme === "goong" ? "bg-taxi font-bold" : "hover:bg-slate-100"
                  }`}
                >
                  <span>Goong.io Tiles</span>
                  <span className="text-[9px] opacity-70">Key</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Thông tin lộ trình thực tế OSRM */}
      {routeStats && (
        <div className="absolute bottom-4 left-4 z-[1000] rounded border-2 border-pixel-border bg-white px-3 py-1.5 shadow-pixel text-xs font-mono font-bold flex items-center gap-2">
          <Navigation className="h-4 w-4 text-blue-600 fill-blue-600" />
          <span>Tuyến đường: {routeStats.distanceKm} km (~{routeStats.durationMin} phút lái xe)</span>
        </div>
      )}

      {/* Banner chế độ chọn vị trí */}
      {selectionMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] rounded border-2 border-pixel-border bg-white px-3 py-1.5 shadow-pixel text-xs font-bold font-mono flex items-center gap-1.5">
          {selectionMode === "pickup" ? (
            <>
              <MapPin className="h-4 w-4 text-emerald-600" />
              <span className="text-emerald-700">Click bản đồ để chọn ĐIỂM ĐÓN</span>
            </>
          ) : (
            <>
              <Flag className="h-4 w-4 text-rose-600" />
              <span className="text-rose-700">Click bản đồ để chọn ĐIỂM ĐẾN</span>
            </>
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
          key={selectedTheme}
          attribution={activeTheme.attribution}
          url={activeTheme.url}
          maxZoom={19}
        />

        <MapEventsHandler onSelect={onSelectLocation} />
        <MapBoundsUpdater
          pickup={pickup}
          destination={destination}
          driver={driverLocation}
          routeCoordinates={roadCoordinates}
        />

        {/* Marker Điểm đón khách (A) */}
        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
            <Popup>
              <div className="text-xs font-bold text-emerald-800">Điểm Đón Khách (A)</div>
              <div className="text-[11px] text-slate-500 font-mono">
                {pickup.lat.toFixed(4)}, {pickup.lng.toFixed(4)}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marker Điểm đến (B) */}
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
