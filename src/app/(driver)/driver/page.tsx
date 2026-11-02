"use client";

import { useState } from "react";
import { useClipboard } from "react-haiku";
import { useQuery } from "@tanstack/react-query";
import { useDriverLocation, useTrip, useTripActions } from "@/hooks";
import { tripService } from "@/services/trip.service";
import { getErrorMessage } from "@/lib/errors";
import { formatVND } from "@/lib/utils";
import { DynamicMap } from "@/components/shared/map/DynamicMap";
import { PixelStatusBadge } from "@/components/shared/pixel/PixelStatusBadge";
import { toast } from "sonner";
import {
  Car,
  Compass,
  Power,
  Navigation,
  CheckCircle,
  Search,
  Copy,
  Check,
  Sparkles,
  BellRing,
  X,
  MapPin,
  Flag,
} from "lucide-react";
import { PRESET_LOCATIONS, type LatLng } from "@/lib/map/haversine";

function getCoordFallback(name?: string, isDest = false): LatLng {
  if (!name) return isDest ? { lat: 10.729, lng: 106.719 } : { lat: 10.7721, lng: 106.698 };
  const clean = name.toLowerCase();
  const match = PRESET_LOCATIONS.find((p) => clean.includes(p.name.split(" (")[0].toLowerCase()));
  if (match) return { lat: match.lat, lng: match.lng };
  return isDest ? { lat: 10.729, lng: 106.719 } : { lat: 10.7721, lng: 106.698 };
}

export default function DriverPage() {
  const [activeTripId, setActiveTripId] = useState<string>("");
  const [inputTripId, setInputTripId] = useState<string>("");
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);

  // Hook tiện ích sao chép mã chuyến từ react-haiku
  const { copy, copied } = useClipboard();

  // Hook 1: Định vị GPS & đồng bộ MongoDB qua Gateway
  const { isOnline, toggleOnline, driverPos, setDriverPos, gpsError } = useDriverLocation(true);

  // Hook 2: Tự động quét các chuyến đi đang được đề xuất cho tài xế này (GET /trips/offers)
  const { data: myOffers } = useQuery({
    queryKey: ["myOffers"],
    queryFn: () => tripService.getMyOffers(),
    refetchInterval: 3000,
    enabled: isOnline,
  });

  // Hook 3: Polling thông tin chuyến đi đang làm việc
  const { data: trip } = useTrip(activeTripId);

  // Hook 4: Các hành động của tài xế (Accept, StartEnRoute, Decline, Pickup, Dropoff)
  const { accept, startEnRoute, decline, pickup, dropoff, isProcessing } = useTripActions(activeTripId);

  const handleToggleOnline = async () => {
    try {
      const nextState = await toggleOnline();
      toast.success(nextState ? "Đã BẬT trạng thái sẵn sàng nhận chuyến" : "Đã TẮT chế độ nhận chuyến");
    } catch (err) {
      toast.error("Lỗi cập nhật trạng thái lên MatchingService", {
        description: getErrorMessage(err),
      });
    }
  };

  const handleAccept = () => {
    accept.mutate(undefined, {
      onSuccess: (updated) => {
        toast.success("Đã nhận chuyến đi thành công!", {
          description: `Bản đồ đang dẫn đường tới điểm đón khách: ${updated.pickup}`,
        });
      },
      onError: (err) => {
        toast.error("Không thể nhận chuyến", {
          description: getErrorMessage(err),
        });
      },
    });
  };

  const handleStartEnRoute = () => {
    startEnRoute.mutate(undefined, {
      onSuccess: (updated) => {
        toast.success("Bắt đầu di chuyển đến điểm đón!", {
          description: `Đang trên đường đón khách tại: ${updated.pickup}`,
        });
      },
      onError: (err) => {
        toast.error("Không thể chuyển trạng thái", {
          description: getErrorMessage(err),
        });
      },
    });
  };

  const handleDecline = () => {
    decline.mutate(undefined, {
      onSuccess: () => {
        toast.info("Đã từ chối chuyến đi. Hệ thống đang điều phối cho tài xế kế tiếp.");
        setActiveTripId("");
      },
      onError: (err) => {
        toast.error("Lỗi khi từ chối chuyến", {
          description: getErrorMessage(err),
        });
      },
    });
  };

  const handlePickup = () => {
    pickup.mutate(undefined, {
      onSuccess: (updated) => {
        toast.success("Đã xác nhận đón khách!", {
          description: `Bản đồ đang chuyển hướng đến điểm đến: ${updated.destination}`,
        });
      },
      onError: (err) => {
        toast.error("Không thể chuyển trạng thái", {
          description: getErrorMessage(err),
        });
      },
    });
  };

  const handleDropoff = () => {
    dropoff.mutate(undefined, {
      onSuccess: () => {
        toast.success("Đã hoàn thành chuyến đi!", {
          description: `Chuyến xe đã kết thúc. Outbox Saga đang kích hoạt thanh toán.`,
        });
      },
      onError: (err) => {
        toast.error("Không thể trả khách", {
          description: getErrorMessage(err),
        });
      },
    });
  };

  const handleSearchTrip = () => {
    if (!inputTripId.trim()) {
      toast.error("Vui lòng nhập mã chuyến đi");
      return;
    }
    setActiveTripId(inputTripId.trim());
    toast.info(`Đang tra cứu chuyến: ${inputTripId.trim().substring(0, 8)}...`);
  };

  const handleMoveDriverTo = async (pos: LatLng, name?: string) => {
    await setDriverPos(pos);
    setIsSelectingLocation(false);
    toast.success(`Đã di chuyển vị trí xe đến: ${name || `${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`}`);
  };

  // Xác định các điểm ghim Marker và tuyến đường OSRM dẫn đường
  let mapPickup: LatLng | null = null;
  let mapDestination: LatLng | null = null;
  let routeFrom: LatLng | null = null;
  let routeTo: LatLng | null = null;
  let navigationBanner = "";

  if (trip) {
    const customerPickup: LatLng =
      trip.pickupLat && trip.pickupLng
        ? { lat: trip.pickupLat, lng: trip.pickupLng }
        : getCoordFallback(trip.pickup, false);
    const customerDest: LatLng =
      trip.destinationLat && trip.destinationLng
        ? { lat: trip.destinationLat, lng: trip.destinationLng }
        : getCoordFallback(trip.destination, true);

    mapPickup = customerPickup;
    mapDestination = customerDest;

    if (trip.status === "DriverAccepted" || trip.status === "EnRoute") {
      // Giai đoạn 1 & 2: Đã nhận cuốc / Đang đến đón -> Dẫn đường từ vị trí tài xế đến điểm đón khách (A)
      routeFrom = driverPos;
      routeTo = customerPickup;
      navigationBanner = `DẪN ĐƯỜNG TỚI ĐIỂM ĐÓN KHÁCH (A): ${trip.pickup}`;
    } else if (trip.status === "PickedUp") {
      // Giai đoạn 2: Đã đón khách -> Dẫn đường từ vị trí xe đến điểm trả khách (B)
      routeFrom = driverPos;
      routeTo = customerDest;
      navigationBanner = `DẪN ĐƯỜNG TỚI ĐIỂM TRẢ KHÁCH (B): ${trip.destination}`;
    } else {
      // Giai đoạn xem trước (Requested, DriverOffered...): Lộ trình khách đặt A -> B
      routeFrom = customerPickup;
      routeTo = customerDest;
    }
  } else if (myOffers && myOffers.length > 0) {
    const offerPickup: LatLng =
      myOffers[0].pickupLat && myOffers[0].pickupLng
        ? { lat: myOffers[0].pickupLat, lng: myOffers[0].pickupLng }
        : getCoordFallback(myOffers[0].pickup, false);
    const offerDest: LatLng =
      myOffers[0].destinationLat && myOffers[0].destinationLng
        ? { lat: myOffers[0].destinationLat, lng: myOffers[0].destinationLng }
        : getCoordFallback(myOffers[0].destination, true);

    mapPickup = offerPickup;
    mapDestination = offerDest;
    routeFrom = driverPos;
    routeTo = offerPickup;
    navigationBanner = `ĐỀ XUẤT CUỐC MỚI: Đón khách tại ${myOffers[0].pickup}`;
  }

  return (
    <div className="flex h-[calc(100vh-61px)] flex-col md:flex-row">
      {/* Cột trái: Bảng điều khiển Tài xế */}
      <div className="w-full md:w-[420px] lg:w-[460px] flex-shrink-0 overflow-y-auto p-4 space-y-4 border-r-2 border-pixel-border bg-slate-50">
        {/* Card Trạng thái Sẵn sàng */}
        <div className="pixel-card rounded-lg p-5 bg-white space-y-3">
          <div className="flex items-center justify-between border-b-2 border-pixel-border pb-3">
            <div className="flex items-center gap-2">
              <div className="rounded border-2 border-pixel-border bg-taxi p-1.5 shadow-pixel-sm">
                <Car className="h-5 w-5 text-pixel-border" />
              </div>
              <div>
                <h1 className="text-base font-black font-mono">BẢNG ĐIỀU KHIỂN</h1>
                <p className="text-[11px] text-pixel-muted">Driver Console</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleOnline}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                isOnline
                  ? "bg-emerald-500 text-white border-pixel-border shadow-pixel-sm"
                  : "bg-slate-200 text-slate-700 border-slate-400"
              }`}
            >
              <Power className="h-3.5 w-3.5" />
              <span>{isOnline ? "Đang Online" : "Ngoại tuyến"}</span>
            </button>
          </div>

          {/* Vị trí GPS */}
          <div className="rounded border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-slate-500 flex items-center gap-1">
                <Compass className="h-3.5 w-3.5 text-blue-600" /> Vị trí hiện tại:
              </span>
              <span className="font-bold text-slate-800">
                {driverPos.lat.toFixed(4)}, {driverPos.lng.toFixed(4)}
              </span>
            </div>

            {gpsError ? (
              <p className="text-[10px] text-amber-700">Lưu ý GPS: {gpsError} (Dùng tọa độ giả lập)</p>
            ) : (
              <p className="text-[10px] text-emerald-700">✓ Đang đồng bộ vị trí thực với MongoDB qua Gateway</p>
            )}
          </div>

          {/* Tùy chỉnh vị trí xe tài xế (Mô phỏng GPS / Chọn bản đồ) */}
          <div className="pt-2 border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-taxi" />
                <span>Mô phỏng vị trí xe (GPS):</span>
              </span>
              <button
                type="button"
                onClick={() => setIsSelectingLocation(!isSelectingLocation)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                  isSelectingLocation
                    ? "bg-taxi text-pixel-border border-pixel-border animate-pulse"
                    : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
                }`}
              >
                {isSelectingLocation ? "Hủy chọn bản đồ" : "Click chọn trên bản đồ"}
              </button>
            </div>

            <div className="flex flex-wrap gap-1">
              {PRESET_LOCATIONS.map((loc) => (
                <button
                  key={loc.name}
                  type="button"
                  onClick={() => handleMoveDriverTo({ lat: loc.lat, lng: loc.lng }, loc.name)}
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-[10px] font-mono hover:border-taxi hover:bg-amber-50 text-slate-700 font-bold"
                >
                  {loc.name.split(" (")[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Thông báo cuốc xe đang được đề xuất cho bạn (Incoming Offer) */}
        {myOffers && myOffers.length > 0 ? (
          <div className="rounded-lg border-2 border-dashed border-taxi bg-amber-50 p-4 space-y-3 shadow-pixel">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <BellRing className="h-4 w-4 text-taxi animate-bounce" />
                <span>CÓ CUỐC XE MỚI ĐƯỢC ĐỀ XUẤT CHO BẠN!</span>
              </div>
              <span className="font-mono text-sm font-black text-pixel-border">
                {formatVND(myOffers[0].quotedFare)}
              </span>
            </div>

            <div className="text-xs space-y-1.5 text-slate-700 bg-white p-3 rounded border border-amber-200">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900">Điểm đón khách:</strong>
                  <span>{myOffers[0].pickup}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Flag className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900">Điểm đến:</strong>
                  <span>{myOffers[0].destination}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => {
                  setActiveTripId(myOffers[0].id);
                  tripService
                    .acceptTrip(myOffers[0].id)
                    .then((updated) => {
                      toast.success("Đã nhận cuốc xe thành công!", {
                        description: `Bản đồ đang dẫn đường tới điểm đón: ${updated.pickup}`,
                      });
                    })
                    .catch((err) => {
                      toast.error("Không thể nhận cuốc", { description: getErrorMessage(err) });
                    });
                }}
                className="pixel-btn-primary rounded py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Car className="h-4 w-4" />
                <span>CHẤP NHẬN NGAY</span>
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => {
                  tripService
                    .declineTrip(myOffers[0].id)
                    .then(() => {
                      toast.info("Đã từ chối cuốc xe.");
                      setActiveTripId("");
                    })
                    .catch((err) => {
                      toast.error("Lỗi khi từ chối", { description: getErrorMessage(err) });
                    });
                }}
                className="pixel-btn-secondary rounded py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center justify-center gap-1.5"
              >
                <X className="h-4 w-4" />
                <span>TỪ CHỐI</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* Card Tra cứu chuyến theo mã */}
        <div className="pixel-card rounded-lg p-5 bg-white space-y-4">
          <div className="border-b-2 border-pixel-border pb-2">
            <h2 className="text-sm font-bold text-pixel-border flex items-center gap-2">
              <Search className="h-4 w-4 text-taxi" />
              <span>Tìm chuyến theo mã (Trip ID)</span>
            </h2>
            <p className="text-[11px] text-pixel-muted">
              Nhập mã chuyến Rider vừa đặt để điều phối nhận cuốc
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Dán mã chuyến ID vào đây..."
              value={inputTripId}
              onChange={(e) => setInputTripId(e.target.value)}
              className="flex-1 rounded border-2 border-pixel-border p-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-taxi"
            />
            <button
              type="button"
              onClick={handleSearchTrip}
              className="pixel-btn-secondary px-3 py-2 rounded text-xs font-bold flex items-center gap-1"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Xem</span>
            </button>
          </div>
        </div>

        {/* Card Thao tác chuyến đi (Active Trip) */}
        {trip ? (
          <div className="pixel-card rounded-lg p-5 bg-white space-y-4 border-2 border-pixel-border">
            <div className="flex items-center justify-between border-b-2 border-pixel-border pb-3">
              <div>
                <span className="text-[10px] font-bold text-pixel-muted uppercase block">
                  Trạng thái chuyến
                </span>
                <PixelStatusBadge status={trip.status} />
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-pixel-muted uppercase block">Cước phí</span>
                <span className="font-mono text-xl font-black text-pixel-border">
                  {formatVND(trip.quotedFare)}
                </span>
              </div>
            </div>

            {/* Chi tiết đón / trả khách hàng */}
            <div className="space-y-3 text-xs bg-slate-50 p-3 rounded border border-slate-200">
              <div className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-600 text-white font-bold text-[10px]">
                  A
                </span>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">ĐỊA CHỈ ĐÓN KHÁCH</span>
                  <span className="font-bold text-slate-800 text-sm block">{trip.pickup}</span>
                  {trip.pickupLat ? (
                    <span className="text-[10px] font-mono text-emerald-700">
                      Tọa độ đón: {trip.pickupLat.toFixed(4)}, {trip.pickupLng.toFixed(4)}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex items-start gap-2 border-t border-slate-200 pt-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-rose-600 text-white font-bold text-[10px]">
                  B
                </span>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">ĐIỂM ĐẾN</span>
                  <span className="font-bold text-slate-800 text-sm block">{trip.destination}</span>
                  {trip.destinationLat ? (
                    <span className="text-[10px] font-mono text-rose-700">
                      Tọa độ đến: {trip.destinationLat.toFixed(4)}, {trip.destinationLng.toFixed(4)}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Copy ID button */}
              <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  Mã: {trip.id.substring(0, 8)}...
                </span>
                <button
                  type="button"
                  onClick={() => {
                    copy(trip.id);
                    toast.success("Đã sao chép mã chuyến!");
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? "Đã copy" : "Copy ID"}</span>
                </button>
              </div>
            </div>

            {/* Hướng dẫn điều hướng hành trình */}
            {trip.status === "DriverAccepted" && (
              <div className="rounded border-2 border-dashed border-emerald-500 bg-emerald-50 p-2.5 text-xs text-emerald-800 font-bold flex items-center gap-2">
                <Navigation className="h-4 w-4 text-emerald-600 animate-pulse" />
                <span>Bản đồ đang vẽ tuyến đường dẫn bạn đến điểm đón: <strong>{trip.pickup}</strong></span>
              </div>
            )}

            {trip.status === "PickedUp" && (
              <div className="rounded border-2 border-dashed border-blue-500 bg-blue-50 p-2.5 text-xs text-blue-800 font-bold flex items-center gap-2">
                <Flag className="h-4 w-4 text-blue-600 animate-pulse" />
                <span>Bản đồ đang vẽ tuyến đường chở khách đến điểm đến: <strong>{trip.destination}</strong></span>
              </div>
            )}

            {/* Nút thao tác theo State Machine */}
            <div className="pt-2">
              {(trip.status === "DriverOffered" || trip.status === "Requested") && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleAccept}
                    className="pixel-btn-primary rounded-md py-3 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Car className="h-4 w-4" />
                    <span>{accept.isPending ? "Đang nhận..." : "CHẤP NHẬN"}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleDecline}
                    className="pixel-btn-secondary rounded-md py-3 text-xs font-bold flex items-center justify-center gap-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    <span>{decline.isPending ? "Từ chối..." : "TỪ CHỐI"}</span>
                  </button>
                </div>
              )}

              {trip.status === "DriverAccepted" && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleStartEnRoute}
                  className="w-full pixel-btn-primary rounded-md py-3 text-xs font-bold flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-white shadow-pixel-sm disabled:opacity-50"
                >
                  <Navigation className="h-4 w-4" />
                  <span>{startEnRoute.isPending ? "Đang xử lý..." : "BẮT ĐẦU ĐẾN ĐIỂM ĐÓN (En Route)"}</span>
                </button>
              )}

              {trip.status === "EnRoute" && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handlePickup}
                  className="w-full pixel-btn-primary rounded-md py-3 text-xs font-bold flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white shadow-pixel-sm disabled:opacity-50"
                >
                  <Car className="h-4 w-4" />
                  <span>{pickup.isPending ? "Đang xử lý..." : "ĐÃ ĐÓN ĐƯỢC KHÁCH (Pick Up)"}</span>
                </button>
              )}

              {trip.status === "PickedUp" && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleDropoff}
                  className="w-full pixel-btn-primary rounded-md py-3 text-xs font-bold flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>{dropoff.isPending ? "Đang xử lý..." : "ĐÃ TRẢ KHÁCH (Drop Off)"}</span>
                </button>
              )}

              {trip.status === "DroppedOff" && (
                <div className="rounded border border-amber-300 bg-amber-50 p-3 text-center text-xs text-amber-800 font-bold flex items-center justify-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-amber-600" />
                  <span>Đã trả khách thành công! Đang chờ Rider thanh toán qua hệ thống Sổ cái.</span>
                </div>
              )}

              {trip.status === "Paid" && (
                <div className="rounded border border-emerald-400 bg-emerald-50 p-3 text-center text-xs text-emerald-800 font-bold flex items-center justify-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <span>Chuyến đi đã thanh toán hoàn tất! Bạn có thể nhận cuốc xe tiếp theo.</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-slate-300 bg-white p-6 text-center text-xs text-slate-500 space-y-2">
            <Car className="h-8 w-8 mx-auto text-slate-400" />
            <p className="font-bold text-slate-700">Chưa có chuyến đi nào được chọn</p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Khi khách đặt xe ở tab Rider, hãy sao chép mã chuyến (ID) dán vào ô tìm kiếm ở trên để nhận chuyến.
            </p>
          </div>
        )}
      </div>

      {/* Cột phải: Bản đồ giám sát vị trí tài xế & Lộ trình thực tế */}
      <div className="flex-1 h-full min-h-[360px] relative">
        {navigationBanner && (
          <div className="absolute top-4 left-4 right-4 z-[1000] rounded-lg border-2 border-pixel-border bg-pixel-dark text-white p-3 shadow-pixel flex items-center justify-between font-mono text-xs">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-taxi animate-spin" />
              <span className="font-bold">{navigationBanner}</span>
            </div>
            <span className="bg-taxi text-pixel-dark px-2 py-0.5 rounded text-[10px] font-bold">
              GPS LIVE
            </span>
          </div>
        )}

        <DynamicMap
          driverLocation={driverPos}
          pickup={mapPickup}
          destination={mapDestination}
          routeFrom={routeFrom}
          routeTo={routeTo}
          center={driverPos}
          onSelectLocation={isSelectingLocation ? handleMoveDriverTo : undefined}
          selectionMode={isSelectingLocation ? "driver" : null}
        />
      </div>
    </div>
  );
}
