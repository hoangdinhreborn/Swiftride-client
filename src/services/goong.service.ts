import { PRESET_LOCATIONS, type LatLng } from "@/lib/map/haversine";

export interface PlacePrediction {
  placeId: string;
  mainText: string;
  secondaryText: string;
  description: string;
}

const GOONG_API_KEY = process.env.NEXT_PUBLIC_GOONG_API_KEY;

export const goongService = {
  // 1. Gợi ý địa chỉ tiếng Việt thời gian thực (Autocomplete)
  searchPlaces: async (input: string): Promise<PlacePrediction[]> => {
    const trimmed = input.trim();
    if (!trimmed || trimmed.length < 2) return [];

    // Nếu có API key Goong.io, gọi trực tiếp API
    if (GOONG_API_KEY) {
      try {
        const url = `https://rsapi.goong.io/Place/AutoComplete?api_key=${GOONG_API_KEY}&input=${encodeURIComponent(
          trimmed
        )}&limit=5`;
        const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          const data = await res.json();
          if (data.status === "OK" && Array.isArray(data.predictions)) {
            return data.predictions.map((p: any) => ({
              placeId: p.place_id,
              mainText: p.structured_formatting?.main_text || p.description,
              secondaryText: p.structured_formatting?.secondary_text || "",
              description: p.description,
            }));
          }
        }
      } catch {
        // Fallback sang local search
      }
    }

    // Fallback: Tìm kiếm trong danh mục địa danh nội bộ
    const query = trimmed.toLowerCase();
    const matches = PRESET_LOCATIONS.filter((l) => l.name.toLowerCase().includes(query));

    return matches.map((m, idx) => ({
      placeId: `preset_${idx}_${m.lat}_${m.lng}`,
      mainText: m.name,
      secondaryText: "TP. Hồ Chí Minh",
      description: m.name,
    }));
  },

  // 2. Lấy tọa độ chi tiết từ PlaceId
  getPlaceDetail: async (placeId: string): Promise<{ lat: number; lng: number; name: string } | null> => {
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

    if (!GOONG_API_KEY) return null;

    try {
      const url = `https://rsapi.goong.io/Place/Detail?api_key=${GOONG_API_KEY}&place_id=${placeId}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
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

    return null;
  },

  // 3. Chuyển tọa độ click trên bản đồ thành tên đường (Reverse Geocoding)
  reverseGeocode: async (pos: LatLng): Promise<string> => {
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
        // Fallback
      }
    }

    return `Tọa độ (${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)})`;
  },
};
