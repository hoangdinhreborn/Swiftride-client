"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useTrip, usePayment } from "@/hooks";
import { getErrorMessage } from "@/lib/errors";
import { formatVND, formatDate } from "@/lib/utils";
import { PixelStepper } from "@/components/shared/pixel/PixelStepper";
import { PixelStatusBadge } from "@/components/shared/pixel/PixelStatusBadge";
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
} from "lucide-react";

export default function TripTrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tripId } = use(params);
  const [paymentToken, setPaymentToken] = useState<string>("tok_fake_card");

  // Hook 1: Tự động Polling thông tin chuyến đi mỗi 3 giây qua Gateway
  const { data: trip, isLoading, error } = useTrip(tripId);

  // Hook 2: Mutation xử lý thanh toán và đồng bộ sổ cái
  const payMutation = usePayment(tripId);

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

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      {/* Top back link */}
      <div className="flex items-center justify-between">
        <Link
          href="/rider"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-pixel-dark"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Đặt chuyến xe mới</span>
        </Link>

        <span className="text-xs font-mono text-slate-500">Mã chuyến: {trip.id}</span>
      </div>

      {/* Main Status Tracker Card */}
      <div className="pixel-card rounded-lg p-6 bg-white space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-pixel-border pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-pixel-muted block">
              Trạng thái hành trình
            </span>
            <div className="mt-1">
              <PixelStatusBadge status={trip.status} />
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-bold uppercase tracking-wider text-pixel-muted block">
              Cước phí trọn gói
            </span>
            <span className="font-mono text-2xl font-black text-pixel-border">
              {formatVND(trip.quotedFare)}
            </span>
          </div>
        </div>

        {/* Stepper visual */}
        <div className="py-2">
          <PixelStepper currentStatus={trip.status} />
        </div>

        {/* Trip Info Details */}
        <div className="rounded border-2 border-pixel-border bg-slate-50 p-4 space-y-3 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-600 text-white font-bold text-[10px]">
              A
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-bold">Điểm đón khách</span>
              <span className="font-bold text-slate-800">{trip.pickup}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-rose-600 text-white font-bold text-[10px]">
              B
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-bold">Điểm đến</span>
              <span className="font-bold text-slate-800">{trip.destination}</span>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Thời gian đặt: {formatDate(trip.createdAt)}</span>
            <span>
              Tài xế:{" "}
              {trip.driverId ? (
                <strong className="text-emerald-700">TX #{trip.driverId.substring(0, 6)}</strong>
              ) : (
                <em className="text-amber-600">Đang tìm tài xế gần nhất...</em>
              )}
            </span>
          </div>
        </div>

        {/* DroppedOff Payment Action Card */}
        {canPay && (
          <div className="rounded-lg border-2 border-dashed border-amber-500 bg-amber-50 p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold">
              <CreditCard className="h-5 w-5 text-amber-600" />
              <span>Chuyến đi đã hoàn thành! Vui lòng thanh toán cước</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Tài xế đã trả bạn tại điểm đến. Bạn có thể xác nhận thanh toán trực tiếp qua cổng thanh toán
              PaymentService (Sổ cái Double-Entry & Idempotency).
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <select
                value={paymentToken}
                onChange={(e) => setPaymentToken(e.target.value)}
                className="rounded border-2 border-pixel-border bg-white p-2.5 text-xs font-mono"
              >
                <option value="tok_fake_card">Thẻ Visa/Mastercard (tok_fake_card)</option>
                <option value="tok_momo_wallet">Ví MoMo điện tử (tok_momo_wallet)</option>
                <option value="tok_zalopay">ZaloPay (tok_zalopay)</option>
              </select>

              <button
                type="button"
                disabled={payMutation.isPending}
                onClick={handlePay}
                className="pixel-btn-primary rounded-md px-6 py-2.5 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {payMutation.isPending ? (
                  <>
                    <Zap className="h-4 w-4 animate-spin" />
                    <span>Đang xử lý trừ tiền...</span>
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
          <div className="rounded-lg border-2 border-emerald-600 bg-emerald-50 p-6 text-center space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white mb-1 shadow-pixel-sm">
              <CheckCircle2 className="h-6 w-6" />
            </div>

            <h3 className="font-mono text-xl font-black text-emerald-800 tracking-wider">
              [BIÊN LAI ĐIỆN TỬ - ĐÃ THANH TOÁN]
            </h3>

            <p className="text-xs text-emerald-700 max-w-md mx-auto">
              Thanh toán thành công. Giao dịch đã được ghi nhận vào Sổ cái kép (Double-Entry Ledger)
              và hệ thống RabbitMQ Event Saga đã đồng bộ hoàn tất chuyến đi.
            </p>

            <div className="pt-2">
              <Link
                href="/rider"
                className="pixel-btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded text-xs font-bold"
              >
                <Car className="h-4 w-4" />
                <span>Đặt một chuyến xe khác</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Safety info footer */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        <span>Giao dịch được bảo vệ với chữ ký số HMAC-SHA256 & Idempotency Key</span>
      </div>
    </div>
  );
}
