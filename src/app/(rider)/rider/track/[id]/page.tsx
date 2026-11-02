"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useClipboard } from "react-haiku";
import { useQuery } from "@tanstack/react-query";
import { useTrip, usePayment, useTripActions, useNearbyDrivers } from "@/hooks";
import { matchingService } from "@/services/matching.service";
import { getErrorMessage } from "@/lib/errors";
import { formatVND, formatDate } from "@/lib/utils";
import { DynamicMap } from "@/components/shared/map/DynamicMap";
import { PixelStepper } from "@/components/shared/pixel/PixelStepper";
import { PixelStatusBadge } from "@/components/shared/pixel/PixelStatusBadge";
import { PRESET_LOCATIONS, type LatLng } from "@/lib/map/haversine";
import { toast } from "sonner";
import {
  Car,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Clock,
  ShieldCheck,
  Zap,
  Copy,
  Check,
  XCircle,
  Compass,
} from "lucide-react";

function getCoordFallback(name?: string, isDest = false): LatLng {
  if (!name) return isDest ? { lat: 10.729, lng: 106.719 } : { lat: 10.7721, lng: 106.698 };
  const clean = name.toLowerCase();
  const match = PRESET_LOCATIONS.find((p) => clean.includes(p.name.split(" (")[0].toLowerCase()));
  if (match) return { lat: match.lat, lng: match.lng };
  return isDest ? { lat: 10.729, lng: 106.719 } : { lat: 10.7721, lng: 106.698 };
}

export default function TripTrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tripId } = use(params);
  const [paymentToken, setPaymentToken] = useState<string>("tok_fake_card");

  // Hook sao chép mã chuyến từ react-haiku
  const { copy, copied } = useClipboard();

  // Hook 1: Tự động Polling thông tin chuyến đi mỗi 3 giây qua Gateway
  const { data: trip, isLoading, error } = useTrip(tripId);

  // Hook 2: Các action của chuyến đi (Confirm, Cancel)
  const { confirm, cancel } = useTripActions(tripId);

  // Hook 3: Mutation xử lý thanh toán và đồng bộ sổ cái
  const payMutation = usePayment(tripId);

  // Hook 4: Polling vị trí tài xế đã nhận chuyến (khi trip có driverId hoặc offeredDriverId)
  const assignedDriverId = trip?.driverId || trip?.offeredDriverId;
  const { data: assignedDriverLoc } = useQuery<LatLng | null>({
    queryKey: ["driverLocation", assignedDriverId],
    queryFn: async () => {
      if (!assignedDriverId) return null;
      try {
        const res = await matchingService.getDriverLocation(assignedDriverId);
        return { lat: res.latitude, lng: res.longitude };
      } catch {
        return null;
      }
    },
    enabled: !!assignedDriverId,
    refetchInterval: 3000,
  });

  const handlePay = () => {
    payMutation.mutate(
      {
        tripId,
        paymentToken,
      },
      {
        onSuccess: (payment) => {
          toast.success("Yêu cầu thanh toán đã được ghi nhận!", {
            description: `Mã GD: ${payment.id.substring(0, 8)}... Sổ cái kép đã ghi nhận.`,
          });
        },
        onError: (err) => {
          toast.error("Thanh toán thất bại", {
            description: getErrorMessage(err),
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="pixel-card rounded-lg p-6 text-center animate-pulse">
          <Clock className="h-8 w-8 mx-auto text-taxi mb-2" />
          <p className="font-mono text-sm font-bold">ĐANG TẢI DỮ LIỆU TỪ GATEWAY...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <div className="pixel-card rounded-lg p-6 bg-rose-50 border-rose-900 text-rose-900">
          <AlertCircle className="h-8 w-8 mb-2" />
          <h2 className="text-lg font-bold">Không tìm thấy chuyến đi</h2>
          <p className="text-xs mt-1 mb-4">{getErrorMessage(error)}</p>
          <Link href="/rider" className="pixel-btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded text-xs">
            <ArrowLeft className="h-4 w-4" /> Quay lại đặt xe
          </Link>
        </div>
      </div>
    );
  }

  const isCompleted = trip.status === "Paid";
  const canPay = trip.status === "DroppedOff";

  const pickupPos: LatLng =
    trip.pickupLat && trip.pickupLng
      ? { lat: trip.pickupLat, lng: trip.pickupLng }
      : getCoordFallback(trip.pickup, false);

  const destinationPos: LatLng =
    trip.destinationLat && trip.destinationLng
      ? { lat: trip.destinationLat, lng: trip.destinationLng }
      : getCoordFallback(trip.destination, true);

  // Hook 5: Quét các tài xế lân cận quanh điểm đón khi chưa có tài xế nhận cuốc
  const { data: nearbyDrivers } = useNearbyDrivers(pickupPos.lat, pickupPos.lng);

  // Xác định tuyến đường dẫn động theo từng giai đoạn trên màn hình Rider
  let routeFrom: LatLng = pickupPos;
  let routeTo: LatLng = destinationPos;
  let trackBanner = "";

  if ((trip.status === "DriverAccepted" || trip.status === "EnRoute") && assignedDriverLoc) {
    // Tài xế đang đến đón: Tuyến đường từ xe tài xế -> điểm đón A
    routeFrom = assignedDriverLoc;
    routeTo = pickupPos;
    trackBanner = `TÀI XẾ ĐANG DI CHUYỂN TỚI ĐIỂM ĐÓN (A): ${trip.pickup}`;
  } else if (trip.status === "PickedUp") {
    // Đã đón khách: Tuyến đường từ xe tài xế (hoặc điểm đón) -> điểm đến B
    routeFrom = assignedDriverLoc || pickupPos;
    routeTo = destinationPos;
    trackBanner = `ĐANG DI CHUYỂN TỚI ĐIỂM ĐẾN (B): ${trip.destination}`;
  } else {
    // Mặc định (Requested, Searching, DriverOffered...): Tuyến đường lộ trình A -> B
    routeFrom = pickupPos;
    routeTo = destinationPos;
  }

  return (
    <div className="flex h-[calc(100vh-61px)] flex-col md:flex-row">
      {/* Cột trái: Điều khiển theo dõi & Thanh toán */}
      <div className="w-full md:w-[460px] lg:w-[500px] flex-shrink-0 overflow-y-auto p-4 space-y-4 border-r-2 border-pixel-border bg-slate-50">
        {/* Top back link */}
        <div className="flex items-center justify-between">
          <Link
            href="/rider"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-pixel-dark"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Đặt chuyến xe mới</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500">Mã: {trip.id.substring(0, 8)}...</span>
            <button
              type="button"
              onClick={() => {
                copy(trip.id);
                toast.success("Đã sao chép mã chuyến!");
              }}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? "Đã copy" : "Copy"}</span>
            </button>
          </div>
        </div>

        {/* Main Status Tracker Card */}
        <div className="pixel-card rounded-lg p-5 bg-white space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-pixel-border pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-pixel-muted block">
                Trạng thái hành trình
              </span>
              <div className="mt-1">
                <PixelStatusBadge status={trip.status} />
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-pixel-muted block">
                Cước phí trọn gói
              </span>
              <span className="font-mono text-xl font-black text-pixel-border">
                {formatVND(trip.quotedFare)}
              </span>
            </div>
          </div>

          {/* Stepper visual */}
          <div className="py-1">
            <PixelStepper currentStatus={trip.status} />
          </div>

          {/* Action khi chuyến đi đang chờ xác nhận giá (Requested) */}
          {trip.status === "Requested" && (
            <div className="rounded-lg border-2 border-dashed border-taxi bg-amber-50 p-4 space-y-3 shadow-pixel">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <Zap className="h-5 w-5 text-taxi fill-taxi animate-bounce" />
                <span>BƯỚC 1: XÁC NHẬN GIÁ CƯỚC ĐỂ ĐIỀU PHỐI XE</span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed font-semibold">
                Cước phí ước tính là <strong>{formatVND(trip.quotedFare)}</strong>. Vui lòng bấm &ldquo;Đồng ý giá &amp; Tìm xe&rdquo; bên dưới để hệ thống quét và gửi cuốc xe tới tài xế gần nhất!
              </p>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  disabled={confirm.isPending || cancel.isPending}
                  onClick={() =>
                    confirm.mutate(undefined, {
                      onSuccess: () => toast.success("Đã xác nhận giá! Đang điều phối tài xế."),
                      onError: (err) => toast.error("Lỗi xác nhận", { description: getErrorMessage(err) }),
                    })
                  }
                  className="pixel-btn-primary rounded-md px-5 py-2.5 text-xs font-bold flex items-center gap-2 shadow-pixel-sm disabled:opacity-50"
                >
                  <Car className="h-4 w-4" />
                  <span>{confirm.isPending ? "Đang điều phối..." : "ĐỒNG Ý GIÁ & TÌM XE"}</span>
                </button>
                <button
                  type="button"
                  disabled={confirm.isPending || cancel.isPending}
                  onClick={() =>
                    cancel.mutate(undefined, {
                      onSuccess: () => toast.info("Đã hủy chuyến đi."),
                      onError: (err) => toast.error("Lỗi hủy chuyến", { description: getErrorMessage(err) }),
                    })
                  }
                  className="pixel-btn-secondary rounded-md px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <span>Hủy chuyến</span>
                </button>
              </div>
            </div>
          )}

          {/* Đang đề xuất cho tài xế (DriverOffered) */}
          {trip.status === "DriverOffered" && (
            <div className="rounded-lg border-2 border-dashed border-blue-400 bg-blue-50 p-3 text-center text-xs text-blue-900 font-bold flex items-center justify-center gap-2 animate-pulse">
              <Car className="h-4 w-4 text-blue-600" />
              <span>Đã gửi lời mời chuyến đi tới tài xế gần nhất. Đang chờ xác nhận...</span>
            </div>
          )}

          {/* Chuyến đi đã bị hủy (Cancelled) */}
          {trip.status === "Cancelled" && (
            <div className="rounded-lg border-2 border-slate-300 bg-slate-100 p-3 text-center text-xs text-slate-600 font-bold flex items-center justify-center gap-2">
              <XCircle className="h-4 w-4 text-slate-500" />
              <span>Chuyến đi này đã bị hủy.</span>
            </div>
          )}

          {/* Chuyến đi thất bại (Failed) */}
          {trip.status === "Failed" && (
            <div className="rounded-lg border-2 border-rose-300 bg-rose-50 p-3 text-center text-xs text-rose-800 font-bold flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600" />
              <span>Hiện không tìm được tài xế phù hợp quanh khu vực của bạn hoặc các tài xế đều bận.</span>
            </div>
          )}

          {/* Trip Info Details */}
          <div className="rounded border-2 border-pixel-border bg-slate-50 p-3.5 space-y-2.5 text-xs">
            <div className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-600 text-white font-bold text-[10px]">
                A
              </span>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">ĐỊA CHỈ ĐÓN KHÁCH</span>
                <span className="font-bold text-slate-800 text-sm block">{trip.pickup}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 border-t border-slate-200 pt-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-rose-600 text-white font-bold text-[10px]">
                B
              </span>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">ĐIỂM ĐẾN</span>
                <span className="font-bold text-slate-800 text-sm block">{trip.destination}</span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Đặt lúc: {formatDate(trip.createdAt)}</span>
              <span>
                Tài xế:{" "}
                {trip.driverId ? (
                  <strong className="text-emerald-700">TX #{trip.driverId.substring(0, 6)}</strong>
                ) : (
                  <em className="text-amber-600">Đang tìm tài xế...</em>
                )}
              </span>
            </div>
          </div>

          {/* DroppedOff Payment Action Card */}
          {canPay && (
            <div className="rounded-lg border-2 border-dashed border-amber-500 bg-amber-50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <CreditCard className="h-4 w-4 text-amber-600" />
                <span>Chuyến đi đã hoàn thành! Vui lòng thanh toán cước</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Tài xế đã trả bạn tại điểm đến. Vui lòng xác nhận thanh toán trực tiếp qua cổng thanh toán
                PaymentService.
              </p>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <select
                  value={paymentToken}
                  onChange={(e) => setPaymentToken(e.target.value)}
                  className="rounded border-2 border-pixel-border bg-white p-2 text-xs font-mono"
                >
                  <option value="tok_fake_card">Thẻ Visa/Mastercard (tok_fake_card)</option>
                  <option value="tok_momo_wallet">Ví MoMo điện tử (tok_momo_wallet)</option>
                  <option value="tok_zalopay">ZaloPay (tok_zalopay)</option>
                </select>

                <button
                  type="button"
                  disabled={payMutation.isPending}
                  onClick={handlePay}
                  className="pixel-btn-primary rounded-md px-5 py-2 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {payMutation.isPending ? (
                    <>
                      <Zap className="h-4 w-4 animate-spin" />
                      <span>Đang trừ tiền...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      <span>Thanh toán {formatVND(trip.quotedFare)}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Paid Receipt Stamp */}
          {isCompleted && (
            <div className="rounded-lg border-2 border-emerald-600 bg-emerald-50 p-5 text-center space-y-2">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white mb-1 shadow-pixel-sm">
                <CheckCircle2 className="h-5 w-5" />
              </div>

              <h3 className="font-mono text-base font-black text-emerald-800 tracking-wider">
                [BIÊN LAI ĐIỆN TỬ - ĐÃ THANH TOÁN]
              </h3>

              <p className="text-[11px] text-emerald-700 max-w-sm mx-auto">
                Thanh toán thành công. Sổ cái kép đã ghi nhận và chuyến đi đã hoàn tất.
              </p>

              <div className="pt-2">
                <Link
                  href="/rider"
                  className="pixel-btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded text-xs font-bold"
                >
                  <Car className="h-4 w-4" />
                  <span>Đặt chuyến xe mới</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Safety info footer */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Giao dịch được bảo vệ với HMAC-SHA256 & Idempotency Key</span>
        </div>
      </div>

      {/* Cột phải: Bản đồ lộ trình OpenStreetMap + OSRM trực quan */}
      <div className="flex-1 h-full min-h-[360px] relative">
        {trackBanner && (
          <div className="absolute top-4 left-4 right-4 z-[1000] rounded-lg border-2 border-pixel-border bg-pixel-dark text-white p-3 shadow-pixel flex items-center justify-between font-mono text-xs">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-taxi animate-spin" />
              <span className="font-bold">{trackBanner}</span>
            </div>
            <span className="bg-emerald-500 text-white px-2 py-0.5 rounded text-[10px] font-bold">
              GPS LIVE
            </span>
          </div>
        )}

        <DynamicMap
          pickup={pickupPos}
          destination={destinationPos}
          driverLocation={assignedDriverLoc}
          nearbyDrivers={!trip.driverId ? nearbyDrivers || [] : []}
          routeFrom={routeFrom}
          routeTo={routeTo}
          center={assignedDriverLoc || pickupPos || undefined}
        />
      </div>
    </div>
  );
}
