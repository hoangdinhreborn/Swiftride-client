"use client";

import { useState, useEffect } from "react";
import { matchingService } from "@/services/matching.service";
import type { LatLng } from "@/lib/map/haversine";

const DEFAULT_COORDS: LatLng = { lat: 10.7725, lng: 106.699 }; // Bến Thành

export function useDriverLocation(initialOnline = true) {
  const [isOnline, setIsOnline] = useState<boolean>(initialOnline);
  const [driverPos, setDriverPos] = useState<LatLng>(DEFAULT_COORDS);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Theo dõi GPS và đồng bộ vị trí lên MongoDB qua Gateway
  useEffect(() => {
    if (!isOnline || typeof window === "undefined" || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setDriverPos(coords);
        setGpsError(null);

        matchingService
          .updateLocation({
            lat: coords.lat,
            lng: coords.lng,
            isAvailable: true,
          })
          .catch(() => {
            // im lặng retry ở lần cập nhật tiếp theo
          });
      },
      (err) => {
        setGpsError(err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isOnline]);

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
    gpsError,
  };
}
