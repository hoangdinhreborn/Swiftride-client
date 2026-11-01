"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { DynamicMap } from "@/components/shared/map/DynamicMap";
import { BookingForm } from "@/features/rider/booking/BookingForm";
import { QuoteCard } from "@/features/rider/quote/QuoteCard";
import { matchingAdapter } from "@/lib/api/adapters/matching.adapter";
import { tripAdapter } from "@/lib/api/adapters/trip.adapter";
import { getErrorMessage } from "@/lib/api/errors";
import { PRESET_LOCATIONS, type LatLng } from "@/lib/map/haversine";
import type { QuoteDto } from "@/types/backend";

export default function RiderPage() {
  const router = useRouter();

  // Khởi tạo mặc định: Đón ở Bến Thành (Q1), Đến Phú Mỹ Hưng (Q7)
  const [pickupName, setPickupName] = useState(PRESET_LOCATIONS[0].name);
  const [pickupPos, setPickupPos] = useState<LatLng | null>({
    lat: PRESET_LOCATIONS[0].lat,
    lng: PRESET_LOCATIONS[0].lng,
  });

  const [destinationName, setDestinationName] = useState(PRESET_LOCATIONS[1].name);
  const [destinationPos, setDestinationPos] = useState<LatLng | null>({
    lat: PRESET_LOCATIONS[1].lat,
    lng: PRESET_LOCATIONS[1].lng,
  });

  const [promoCode, setPromoCode] = useState<string>("");
  const [selectionMode, setSelectionMode] = useState<"pickup" | "destination" | null>(null);

  const [quote, setQuote] = useState<QuoteDto | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState<boolean>(false);
  const [isBooking, setIsBooking] = useState<boolean>(false);

  // Lấy danh sách tài xế lân cận quanh điểm đón để hiển thị trên bản đồ
  const { data: nearbyDrivers } = useQuery({
    queryKey: ["nearbyDrivers", pickupPos?.lat, pickupPos?.lng],
    queryFn: () => (pickupPos ? matchingAdapter.matchDrivers(pickupPos.lat, pickupPos.lng) : []),
    enabled: !!pickupPos,
    refetchInterval: 6000, // quét lại mỗi 6s
  });

  // Tự động tính giá khi có đủ điểm đón & điểm đến
  const fetchQuote = async () => {
    if (!pickupPos || !destinationPos) return;
    setIsLoadingQuote(true);
    try {
      const q = await matchingAdapter.getQuote({
        pickupLat: pickupPos.lat,
        pickupLng: pickupPos.lng,
        destinationLat: destinationPos.lat,
        destinationLng: destinationPos.lng,
        promoCode: promoCode.trim() || undefined,
      });
      setQuote(q);
    } catch (err) {
      toast.error("Không thể lấy báo giá", {
        description: getErrorMessage(err),
      });
    } finally {
      setIsLoadingQuote(false);
    }
  };

  useEffect(() => {
    fetchQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupPos?.lat, pickupPos?.lng, destinationPos?.lat, destinationPos?.lng]);

  const handleSelectOnMap = (pos: LatLng) => {
    if (selectionMode === "pickup") {
      setPickupPos(pos);
      setPickupName(`Điểm đón (${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)})`);
      setSelectionMode(null);
      toast.success("Đã chọn điểm đón trên bản đồ!");
    } else if (selectionMode === "destination") {
      setDestinationPos(pos);
      setDestinationName(`Điểm đến (${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)})`);
      setSelectionMode(null);
      toast.success("Đã chọn điểm đến trên bản đồ!");
    }
  };

  const handleConfirmBooking = async () => {
    if (!pickupPos || !destinationPos) {
      toast.error("Vui lòng chọn đầy đủ điểm đón và điểm đến");
      return;
    }

    setIsBooking(true);
    try {
      const trip = await tripAdapter.requestTrip({
        pickup: pickupName.trim() || "Điểm đón",
        pickupLat: pickupPos.lat,
        pickupLng: pickupPos.lng,
        destination: destinationName.trim() || "Điểm đến",
        destinationLat: destinationPos.lat,
        destinationLng: destinationPos.lng,
        promoCode: promoCode.trim() || undefined,
      });

      toast.success("Đặt xe thành công!", {
        description: `Mã chuyến: ${trip.id.substring(0, 8)}... Đang tìm tài xế.`,
      });

      router.push(`/rider/track/${trip.id}`);
    } catch (err) {
      toast.error("Không thể tạo chuyến đi", {
        description: getErrorMessage(err),
      });
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-61px)] flex-col md:flex-row">
      {/* Cột trái: Form điều khiển & Báo giá */}
      <div className="w-full md:w-[420px] lg:w-[460px] flex-shrink-0 overflow-y-auto p-4 space-y-4 border-r-2 border-pixel-border bg-slate-50">
        <BookingForm
          pickupName={pickupName}
          setPickupName={setPickupName}
          pickupPos={pickupPos}
          setPickupPos={setPickupPos}
          destinationName={destinationName}
          setDestinationName={setDestinationName}
          destinationPos={destinationPos}
          setDestinationPos={setDestinationPos}
          promoCode={promoCode}
          setPromoCode={setPromoCode}
          selectionMode={selectionMode}
          setSelectionMode={setSelectionMode}
          onGetQuote={fetchQuote}
          isLoadingQuote={isLoadingQuote}
        />

        <QuoteCard
          quote={quote}
          isLoading={isLoadingQuote}
          onConfirmBooking={handleConfirmBooking}
          isBooking={isBooking}
        />
      </div>

      {/* Cột phải: Bản đồ OpenStreetMap Leaflet */}
      <div className="flex-1 h-full min-h-[360px] relative">
        <DynamicMap
          pickup={pickupPos}
          destination={destinationPos}
          nearbyDrivers={nearbyDrivers || []}
          onSelectLocation={handleSelectOnMap}
          selectionMode={selectionMode}
        />
      </div>
    </div>
  );
}
