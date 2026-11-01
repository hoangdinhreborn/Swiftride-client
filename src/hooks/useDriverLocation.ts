"use client";

import { useState, useEffect } from "react";
import { useGeolocation } from "react-haiku";
import { matchingService } from "@/services/matching.service";
import type { LatLng } from "@/lib/map/haversine";

const DEFAULT_COORDS: LatLng = { lat: 10.7725, lng: 106.699 }; // Bến Thành mặc định

export function useDriverLocation(initialOnline = true) {
  const [isOnline, setIsOnline] = useState<boolean>(initialOnline);
  const [driverPos, setDriverPos] = useState<LatLng>(DEFAULT_COORDS);

  // Sử dụng hook useGeolocation chuẩn từ react-haiku (chế độ watch theo dõi liên tục)
  const { latitude, longitude, error: geoError, loading: isLocating } = useGeolocation({
    enableHighAccuracy: true,
    watch: isOnline,
    maximumAge: 5000,
  });

  // Tự động cập nhật vị trí và đồng bộ lên MongoDB qua Gateway khi có tọa độ mới từ useGeolocation
  useEffect(() => {
    if (!isOnline) return;

    if (typeof latitude === "number" && typeof longitude === "number") {
      const coords = { lat: latitude, lng: longitude };
      setDriverPos(coords);

      matchingService
        .updateLocation({
          lat: coords.lat,
          lng: coords.lng,
          isAvailable: true,
        })
        .catch(() => {
          // im lặng retry ở lần cập nhật tiếp theo
        });
    }
  }, [latitude, longitude, isOnline]);

  const toggleOnline = async () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    await matchingService.updateLocation({
      lat: driverPos.lat,
      lng: driverPos.lng,
      isAvailable: nextState,
    });
    return nextState;
  };

  return {
    isOnline,
    toggleOnline,
    driverPos,
    setDriverPos,
    isLocating,
    gpsError: geoError?.message || null,
  };
}
