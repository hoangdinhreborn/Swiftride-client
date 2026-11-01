import type { LatLng } from "@/lib/map/haversine";

export interface RouteGeometry {
  coordinates: [number, number][]; // Mảng các điểm [lat, lng] cho Leaflet Polyline
  distanceMeters: number;
  durationSeconds: number;
}

export const routingService = {
  // Lấy dữ liệu uốn lượn theo mạng lưới đường sá thực tế từ OSRM (Open Source Routing Machine)
  getRoute: async (from: LatLng, to: LatLng): Promise<RouteGeometry | null> => {
    try {
      // OSRM nhận format: {lng},{lat};{lng},{lat}
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;

      const res = await fetch(osrmUrl, {
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) {
        return createFallbackRoute(from, to);
      }

      const data = await res.json();
      if (data.code === "Ok" && Array.isArray(data.routes) && data.routes.length > 0) {
        const route = data.routes[0];
        // Chuyển đổi [lng, lat] của GeoJSON thành [lat, lng] cho Leaflet
        const coordinates: [number, number][] = route.geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );

        return {
          coordinates,
          distanceMeters: route.distance,
          durationSeconds: route.duration,
        };
      }

      return createFallbackRoute(from, to);
    } catch {
      return createFallbackRoute(from, to);
    }
  },
};

function createFallbackRoute(from: LatLng, to: LatLng): RouteGeometry {
  return {
    coordinates: [
      [from.lat, from.lng],
      [to.lat, to.lng],
    ],
    distanceMeters: 0,
    durationSeconds: 0,
  };
}
