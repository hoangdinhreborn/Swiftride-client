import { PRESET_LOCATIONS, type LatLng } from "@/lib/map/haversine";

export interface PlacePrediction {
  placeId: string;
  mainText: string;
  secondaryText: string;
  description: string;
}

const GOONG_API_KEY = process.env.NEXT_PUBLIC_GOONG_API_KEY;

export const goongService = {
  // 1. Gợi ý địa chỉ tiếng Việt thời gian thực (Goong.io -> OpenStreetMap Nominatim Vietnam -> Local Cache)
  searchPlaces: async (input: string): Promise<PlacePrediction[]> => {
    const trimmed = input.trim();
    if (!trimmed || trimmed.length < 2) return [];

    // TẦNG 1: Nếu có API key Goong.io, gọi Goong Places Autocomplete API
    if (GOONG_API_KEY) {
      try {
        const url = `https://rsapi.goong.io/Place/AutoComplete?api_key=${GOONG_API_KEY}&input=${encodeURIComponent(
          trimmed
        )}&limit=5`;
        const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
        if (res.ok) {
          const data = await res.json();
          if (data.status === "OK" && Array.isArray(data.predictions) && data.predictions.length > 0) {
            return data.predictions.map((p: any) => ({
              placeId: p.place_id,
              mainText: p.structured_formatting?.main_text || p.description,
              secondaryText: p.structured_formatting?.secondary_text || "",
              description: p.description,
            }));
          }
        }
      } catch {
        // Fallback sang Nominatim
      }
    }

    // TẦNG 2: OpenStreetMap Nominatim Vietnam (100% miễn phí, tìm chính xác mọi ngóc ngách Việt Nam)
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        trimmed
      )}&format=json&addressdetails=1&limit=5&countrycodes=vn`;

      const res = await fetch(nominatimUrl, {
        headers: { "User-Agent": "SwiftRide-Client/1.0" },
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) {
        const items = await res.json();
        if (Array.isArray(items) && items.length > 0) {
          return items.map((item: any, idx: number) => {
            const parts = (item.display_name || "").split(",");
            const mainText = item.name || parts[0]?.trim() || trimmed;
            const secondaryText = parts.slice(1, 4).join(",").trim() || "Việt Nam";

            return {
              placeId: `osm_${item.lat}_${item.lon}_${idx}`,
              mainText,
              secondaryText,
              description: item.display_name,
            };
          });
        }
      }
    } catch {
      // Fallback sang Local Cache
    }

    // TẦNG 3: Danh mục địa danh nội bộ mẫu TP. Hồ Chí Minh
    const query = trimmed.toLowerCase();
    const matches = PRESET_LOCATIONS.filter((l) => l.name.toLowerCase().includes(query));

    return matches.map((m, idx) => ({
      placeId: `preset_${idx}_${m.lat}_${m.lng}`,
      mainText: m.name,
      secondaryText: "TP. Hồ Chí Minh, Việt Nam",
      description: m.name,
    }));
  },

  // 2. Lấy tọa độ chi tiết từ PlaceId
  getPlaceDetail: async (placeId: string): Promise<{ lat: number; lng: number; name: string } | null> => {
    // Nếu là kết quả từ OpenStreetMap Nominatim
    if (placeId.startsWith("osm_")) {
      const parts = placeId.split("_");
      const lat = parseFloat(parts[1]);
      const lng = parseFloat(parts[2]);
      return {
        lat,
        lng,
        name: "Địa điểm đã chọn",
      };
    }

    // Nếu là địa danh fallback
    if (placeId.startsWith("preset_")) {
      const parts = placeId.split("_");
      const lat = parseFloat(parts[2]);
      const lng = parseFloat(parts[3]);
      const found = PRESET_LOCATIONS.find((l) => Math.abs(l.lat - lat) < 0.0001 && Math.abs(l.lng - lng) < 0.0001);
      return {
        lat,
        lng,
        name: found?.name || "Địa điểm đã chọn",
      };
    }

    // Gọi Goong Place Detail API nếu có key
    if (GOONG_API_KEY) {
      try {
        const url = `https://rsapi.goong.io/Place/Detail?api_key=${GOONG_API_KEY}&place_id=${placeId}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
        if (res.ok) {
          const data = await res.json();
          if (data.status === "OK" && data.result?.geometry?.location) {
            return {
              lat: data.result.geometry.location.lat,
              lng: data.result.geometry.location.lng,
              name: data.result.name || data.result.formatted_address,
            };
          }
        }
      } catch {
        return null;
      }
    }

    return null;
  },

  // 3. Dịch ngược tọa độ click trên bản đồ thành tên đường tiếng Việt (Reverse Geocoding)
  reverseGeocode: async (pos: LatLng): Promise<string> => {
    // Ưu tiên Goong nếu có key
    if (GOONG_API_KEY) {
      try {
        const url = `https://rsapi.goong.io/Geocode?latlng=${pos.lat},${pos.lng}&api_key=${GOONG_API_KEY}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const data = await res.json();
          if (data.status === "OK" && data.results?.[0]?.formatted_address) {
            return data.results[0].formatted_address;
          }
        }
      } catch {
        // Fallback sang Nominatim
      }
    }

    // Dùng OpenStreetMap Nominatim Reverse Geocoding
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${pos.lat}&lon=${pos.lng}&format=json&countrycodes=vn`;
      const res = await fetch(nominatimUrl, {
        headers: { "User-Agent": "SwiftRide-Client/1.0" },
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          // Lấy 3 thành phần đầu (tên đường, phường, quận)
          const parts = data.display_name.split(",");
          if (parts.length >= 3) {
            return parts.slice(0, 3).join(",").trim();
          }
          return data.display_name;
        }
      }
    } catch {
      // Fallback
    }

    return `Vị trí (${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)})`;
  },
};
