"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuote, useNearbyDrivers, useCreateTrip } from "@/hooks";
import { goongService } from "@/services";
import { DynamicMap } from "@/components/shared/map/DynamicMap";
import { BookingForm } from "@/features/rider/booking/BookingForm";
import { QuoteCard } from "@/features/rider/quote/QuoteCard";
import { getErrorMessage } from "@/lib/errors";
import { PRESET_LOCATIONS, type LatLng } from "@/lib/map/haversine";
import { toast } from "sonner";

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

  // Hook 1: Tính toán báo giá tự động khi có đủ 2 điểm (TanStack Query)
  const quoteRequest =
    pickupPos && destinationPos
      ? {
          pickupLat: pickupPos.lat,
          pickupLng: pickupPos.lng,
          destinationLat: destinationPos.lat,
          destinationLng: destinationPos.lng,
          promoCode: promoCode.trim() || undefined,
        }
      : null;

  const { data: quote, isLoading: isLoadingQuote, refetch: refetchQuote } = useQuote(quoteRequest);

  // Hook 2: Quét danh sách tài xế lân cận quanh điểm đón
  const { data: nearbyDrivers } = useNearbyDrivers(pickupPos?.lat, pickupPos?.lng);

  // Hook 3: Mutation tạo chuyến đi
  const createTripMutation = useCreateTrip();

  const handleSelectOnMap = async (pos: LatLng) => {
    if (selectionMode === "pickup") {
      setPickupPos(pos);
      setPickupName("Đang xác định tên đường...");
      setSelectionMode(null);
      const address = await goongService.reverseGeocode(pos);
      setPickupName(address);
      toast.success("Đã chọn điểm đón trên bản đồ!");
    } else if (selectionMode === "destination") {
      setDestinationPos(pos);
      setDestinationName("Đang xác định tên đường...");
      setSelectionMode(null);
      const address = await goongService.reverseGeocode(pos);
      setDestinationName(address);
      toast.success("Đã chọn điểm đến trên bản đồ!");
    }
  };

  const handleConfirmBooking = () => {
    if (!pickupPos || !destinationPos) {
      toast.error("Vui lòng chọn đầy đủ điểm đón và điểm đến");
      return;
    }

    createTripMutation.mutate(
      {
        pickup: pickupName.trim() || "Điểm đón",
        pickupLat: pickupPos.lat,
        pickupLng: pickupPos.lng,
        destination: destinationName.trim() || "Điểm đến",
        destinationLat: destinationPos.lat,
        destinationLng: destinationPos.lng,
        promoCode: promoCode.trim() || undefined,
      },
      {
        onSuccess: (trip) => {
          toast.success("Đặt xe thành công!", {
            description: `Mã chuyến: ${trip.id.substring(0, 8)}... Đang tìm tài xế.`,
          });
          router.push(`/rider/track/${trip.id}`);
        },
        onError: (err) => {
          toast.error("Không thể tạo chuyến đi", {
            description: getErrorMessage(err),
          });
        },
      }
    );
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
          onGetQuote={() => refetchQuote()}
          isLoadingQuote={isLoadingQuote}
        />

        <QuoteCard
          quote={quote || null}
          isLoading={isLoadingQuote}
          onConfirmBooking={handleConfirmBooking}
          isBooking={createTripMutation.isPending}
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
