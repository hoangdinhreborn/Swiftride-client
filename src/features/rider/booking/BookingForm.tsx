"use client";

import { useState, useEffect } from "react";
import { useDebounce } from "react-haiku";
import { Navigation2, Compass, Tag, RefreshCw, Search, MapPin } from "lucide-react";
import { PRESET_LOCATIONS, type LatLng } from "@/lib/map/haversine";
import { goongService, type PlacePrediction } from "@/services/goong.service";
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

  // 1. Dùng useDebounce từ react-haiku để debounce input tìm kiếm địa chỉ
  const debouncedPickupQuery = useDebounce(pickupName, 350);
  const debouncedDestQuery = useDebounce(destinationName, 350);

  const [pickupSuggestions, setPickupSuggestions] = useState<PlacePrediction[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<PlacePrediction[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<"pickup" | "dest" | null>(null);

  // Gợi ý địa chỉ điểm đón
  useEffect(() => {
    if (!debouncedPickupQuery || debouncedPickupQuery.length < 2) {
      setPickupSuggestions([]);
      return;
    }
    // Tránh tìm kiếm nếu địa chỉ là do vừa click chọn
    if (pickupPos && pickupName.includes(pickupPos.lat.toFixed(2))) return;

    goongService.searchPlaces(debouncedPickupQuery).then((results) => {
      setPickupSuggestions(results);
    });
  }, [debouncedPickupQuery, pickupPos, pickupName]);

  // Gợi ý địa chỉ điểm đến
  useEffect(() => {
    if (!debouncedDestQuery || debouncedDestQuery.length < 2) {
      setDestSuggestions([]);
      return;
    }
    if (destinationPos && destinationName.includes(destinationPos.lat.toFixed(2))) return;

    goongService.searchPlaces(debouncedDestQuery).then((results) => {
      setDestSuggestions(results);
    });
  }, [debouncedDestQuery, destinationPos, destinationName]);

  const handleSelectPrediction = async (type: "pickup" | "dest", pred: PlacePrediction) => {
    const detail = await goongService.getPlaceDetail(pred.placeId);
    if (!detail) {
      toast.error("Không thể lấy tọa độ của địa điểm này");
      return;
    }

    if (type === "pickup") {
      setPickupName(pred.mainText);
      setPickupPos({ lat: detail.lat, lng: detail.lng });
      setPickupSuggestions([]);
      setActiveDropdown(null);
      toast.success(`Đã chọn điểm đón: ${pred.mainText}`);
    } else {
      setDestinationName(pred.mainText);
      setDestinationPos({ lat: detail.lat, lng: detail.lng });
      setDestSuggestions([]);
      setActiveDropdown(null);
      toast.success(`Đã chọn điểm đến: ${pred.mainText}`);
    }
  };

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
        setPickupName("Vị trí GPS của bạn");
        setIsGettingLocation(false);
        toast.success("Đã định vị thành công!");
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
    setActiveDropdown(null);
  };

  return (
    <div className="pixel-card rounded-lg p-5 bg-white space-y-4">
      <div className="border-b-2 border-pixel-border pb-3">
        <h2 className="text-base font-bold text-pixel-border flex items-center gap-2">
          <Navigation2 className="h-5 w-5 text-taxi" />
          <span>Lộ trình chuyến đi</span>
        </h2>
        <p className="text-xs text-pixel-muted">
          Tìm kiếm địa chỉ Việt Nam qua Goong.io hoặc chọn trực tiếp trên bản đồ
        </p>
      </div>

      {/* Điểm đón (Pickup) */}
      <div className="relative">
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
          placeholder="Gõ tìm kiếm địa chỉ đón..."
          value={pickupName}
          onChange={(e) => {
            setPickupName(e.target.value);
            setActiveDropdown("pickup");
          }}
          onFocus={() => setActiveDropdown("pickup")}
          className="w-full rounded border-2 border-pixel-border p-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        {/* Dropdown gợi ý địa chỉ điểm đón */}
        {activeDropdown === "pickup" && pickupSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto rounded border-2 border-pixel-border bg-white shadow-pixel-lg">
            {pickupSuggestions.map((s) => (
              <button
                key={s.placeId}
                type="button"
                onClick={() => handleSelectPrediction("pickup", s)}
                className="w-full text-left p-2.5 hover:bg-emerald-50 border-b border-slate-100 last:border-0 flex items-start gap-2"
              >
                <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-slate-800 block">{s.mainText}</span>
                  <span className="text-[10px] text-slate-500">{s.secondaryText || s.description}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {pickupPos && (
          <span className="text-[10px] font-mono text-emerald-700 block mt-1">
            Tọa độ: {pickupPos.lat.toFixed(4)}, {pickupPos.lng.toFixed(4)}
          </span>
        )}
      </div>

      {/* Điểm đến (Destination) */}
      <div className="relative">
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
          placeholder="Gõ tìm kiếm địa chỉ đến..."
          value={destinationName}
          onChange={(e) => {
            setDestinationName(e.target.value);
            setActiveDropdown("dest");
          }}
          onFocus={() => setActiveDropdown("dest")}
          className="w-full rounded border-2 border-pixel-border p-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
        />

        {/* Dropdown gợi ý địa chỉ điểm đến */}
        {activeDropdown === "dest" && destSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto rounded border-2 border-pixel-border bg-white shadow-pixel-lg">
            {destSuggestions.map((s) => (
              <button
                key={s.placeId}
                type="button"
                onClick={() => handleSelectPrediction("dest", s)}
                className="w-full text-left p-2.5 hover:bg-rose-50 border-b border-slate-100 last:border-0 flex items-start gap-2"
              >
                <MapPin className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-slate-800 block">{s.mainText}</span>
                  <span className="text-[10px] text-slate-500">{s.secondaryText || s.description}</span>
                </div>
              </button>
            ))}
          </div>
        )}

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
