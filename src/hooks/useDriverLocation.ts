"use client";

import { useState, useEffect } from "react";
import { useGeolocation } from "react-haiku";
import { matchingService } from "@/services/matching.service";
import type { LatLng } from "@/lib/map/haversine";

const DEFAULT_COORDS: LatLng = { lat: 10.7725, lng: 106.699 }; // Bến Thành mặc định (cách Rider 100m)

export function useDriverLocation(initialOnline = true) {
  const [isOnline, setIsOnline] = useState<boolean>(initialOnline);
  const [driverPos, setDriverPos] = useState<LatLng>(DEFAULT_COORDS);

  // Hook useGeolocation từ react-haiku (theo dõi GPS khi có quyền)
  const { latitude, longitude, error: geoError, loading: isLocating } = useGeolocation({
    enableHighAccuracy: true,
    watch: isOnline,
    maximumAge: 5000,
  });

  // Tọa độ hiệu lực: ưu tiên GPS thực tế, nếu desktop/không có GPS thì dùng driverPos
  const effectiveLat = typeof latitude === "number" ? latitude : driverPos.lat;
  const effectiveLng = typeof longitude === "number" ? longitude : driverPos.lng;

  // Cập nhật driverPos khi nhận được tọa độ GPS mới
  useEffect(() => {
    if (typeof latitude === "number" && typeof longitude === "number") {
      setDriverPos({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude]);

  // Luôn gửi vị trí & Heartbeat lên MongoDB mỗi 5 giây khi Online để Backend luôn thấy tài xế khả dụng
  useEffect(() => {
    if (!isOnline) return;

    const syncLocation = () => {
      matchingService
        .updateLocation({
          lat: effectiveLat,
          lng: effectiveLng,
          isAvailable: true,
        })
        .catch(() => {
          // im lặng retry ở lần gửi heartbeat tiếp theo
        });
    };

    // Gửi ngay lập tức khi mount / khi chuyển Online
    syncLocation();

    // Gửi định kỳ mỗi 5 giây (Heartbeat để MongoDB UpdatedAt luôn < 5 phút)
    const timerId = setInterval(syncLocation, 5000);
    return () => clearInterval(timerId);
  }, [isOnline, effectiveLat, effectiveLng]);

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

  const updatePositionManually = async (newPos: LatLng) => {
    setDriverPos(newPos);
    if (isOnline) {
      await matchingService.updateLocation({
        lat: newPos.lat,
        lng: newPos.lng,
        isAvailable: true,
      });
    }
  };

  return {
    isOnline,
    toggleOnline,
    driverPos,
    setDriverPos: updatePositionManually,
    isLocating,
    gpsError: geoError?.message || null,
  };
}
