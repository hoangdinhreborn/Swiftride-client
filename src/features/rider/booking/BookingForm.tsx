"use client";

import { useState } from "react";
import { MapPin, Navigation2, Compass, Tag, RefreshCw } from "lucide-react";
import { PRESET_LOCATIONS, type LatLng } from "@/lib/map/haversine";
import { toast } from "sonner";

interface Props {
  pickupName: string;
  setPickupName: (name: string) => void;
  pickupPos: LatLng | null;
  setPickupPos: (pos: LatLng | null) => void;

  destinationName: string;
  setDestinationName: (name: string) => void;
  destinationPos: LatLng | null;
  setDestinationPos: (pos: LatLng | null) => void;

  promoCode: string;
  setPromoCode: (code: string) => void;

  selectionMode: "pickup" | "destination" | null;
  setSelectionMode: (mode: "pickup" | "destination" | null) => void;

  onGetQuote: () => void;
  isLoadingQuote: boolean;
}

export function BookingForm({
  pickupName,
  setPickupName,
  pickupPos,
  setPickupPos,
  destinationName,
  setDestinationName,
  destinationPos,
  setDestinationPos,
  promoCode,
  setPromoCode,
  selectionMode,
  setSelectionMode,
  onGetQuote,
  isLoadingQuote,
}: Props) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Trình duyệt không hỗ trợ Geolocation API");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPickupPos(coords);
        setPickupName("Vị trí hiện tại của bạn");
        setIsGettingLocation(false);
        toast.success("Đã lấy được tọa độ hiện tại!");
      },
      (err) => {
        setIsGettingLocation(false);
        toast.error("Không thể lấy vị trí GPS", { description: err.message });
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleApplyPreset = (type: "pickup" | "dest", preset: (typeof PRESET_LOCATIONS)[0]) => {
    if (type === "pickup") {
      setPickupName(preset.name);
      setPickupPos({ lat: preset.lat, lng: preset.lng });
    } else {
      setDestinationName(preset.name);
      setDestinationPos({ lat: preset.lat, lng: preset.lng });
    }
  };

  return (
    <div className="pixel-card rounded-lg p-5 bg-white space-y-4">
      <div className="border-b-2 border-pixel-border pb-3">
        <h2 className="text-base font-bold text-pixel-border flex items-center gap-2">
          <Navigation2 className="h-5 w-5 text-taxi" />
          <span>Lộ trình chuyến đi</span>
        </h2>
        <p className="text-xs text-pixel-muted">
          Chọn tọa độ điểm đón và điểm đến để nhận báo giá từ MatchingService
        </p>
      </div>

      {/* Điểm đón (Pickup) */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px]">
              A
            </span>
            <span>Điểm đón (Pickup)</span>
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={isGettingLocation}
              className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 disabled:opacity-50"
            >
              <Compass className="h-3.5 w-3.5" />
              <span>{isGettingLocation ? "Đang định vị..." : "GPS của tôi"}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectionMode(selectionMode === "pickup" ? null : "pickup")}
              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                selectionMode === "pickup"
                  ? "bg-emerald-600 text-white border-pixel-border"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {selectionMode === "pickup" ? "Hủy chọn" : "Bản đồ 📍"}
            </button>
          </div>
        </div>

        <input
          type="text"
          placeholder="Nhập địa chỉ đón khách..."
          value={pickupName}
          onChange={(e) => setPickupName(e.target.value)}
          className="w-full rounded border-2 border-pixel-border p-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        {pickupPos && (
          <span className="text-[10px] font-mono text-emerald-700 block mt-1">
            Tọa độ: {pickupPos.lat.toFixed(4)}, {pickupPos.lng.toFixed(4)}
          </span>
        )}
      </div>

      {/* Điểm đến (Destination) */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-white text-[10px]">
              B
            </span>
            <span>Điểm đến (Destination)</span>
          </label>

          <button
            type="button"
            onClick={() => setSelectionMode(selectionMode === "destination" ? null : "destination")}
            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              selectionMode === "destination"
                ? "bg-rose-600 text-white border-pixel-border"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {selectionMode === "destination" ? "Hủy chọn" : "Bản đồ 🎯"}
          </button>
        </div>

        <input
          type="text"
          placeholder="Nhập địa chỉ điểm đến..."
          value={destinationName}
          onChange={(e) => setDestinationName(e.target.value)}
          className="w-full rounded border-2 border-pixel-border p-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
        />

        {destinationPos && (
          <span className="text-[10px] font-mono text-rose-700 block mt-1">
            Tọa độ: {destinationPos.lat.toFixed(4)}, {destinationPos.lng.toFixed(4)}
          </span>
        )}
      </div>

      {/* Địa điểm mẫu (Presets) */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
          Chọn nhanh địa điểm mẫu (TP.HCM)
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_LOCATIONS.map((p) => (
            <div key={p.name} className="inline-flex rounded border border-slate-200 text-[11px] overflow-hidden">
              <span className="bg-slate-100 px-2 py-1 font-medium text-slate-700">{p.name}</span>
              <button
                type="button"
                onClick={() => handleApplyPreset("pickup", p)}
                title="Đặt làm điểm đón"
                className="bg-emerald-50 px-1.5 py-1 text-emerald-700 hover:bg-emerald-100 font-bold border-l border-slate-200"
              >
                Đón
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset("dest", p)}
                title="Đặt làm điểm đến"
                className="bg-rose-50 px-1.5 py-1 text-rose-700 hover:bg-rose-100 font-bold border-l border-slate-200"
              >
                Đến
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Mã khuyến mãi */}
      <div>
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
          <Tag className="h-3.5 w-3.5 text-taxi" />
          <span>Mã khuyến mãi (Ưu đãi)</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nhập mã (ví dụ: SWIFT10)"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            className="flex-1 rounded border-2 border-pixel-border p-2 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-taxi"
          />
          <button
            type="button"
            onClick={() => setPromoCode("SWIFT10")}
            className="rounded border border-slate-300 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
          >
            Thử SWIFT10 (-10%)
          </button>
        </div>
      </div>

      {/* Button tính báo giá */}
      <button
        type="button"
        disabled={!pickupPos || !destinationPos || isLoadingQuote}
        onClick={onGetQuote}
        className="w-full pixel-btn-secondary rounded-md py-2.5 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-40"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isLoadingQuote ? "animate-spin" : ""}`} />
        <span>{isLoadingQuote ? "Đang tính giá từ Matching..." : "Cập nhật báo giá"}</span>
      </button>
    </div>
  );
}
