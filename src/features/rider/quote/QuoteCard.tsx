"use client";

import { formatVND, formatDuration } from "@/lib/utils";
import { PixelBadge } from "@/components/shared/pixel/PixelBadge";
import { Zap, Clock, Navigation, Tag, ArrowRight } from "lucide-react";
import type { QuoteDto } from "@/types/backend";

interface Props {
  quote: QuoteDto | null;
  isLoading: boolean;
  onConfirmBooking: () => void;
  isBooking: boolean;
}

export function QuoteCard({ quote, isLoading, onConfirmBooking, isBooking }: Props) {
  if (isLoading) {
    return (
      <div className="pixel-card rounded-lg p-5 animate-pulse bg-slate-50">
        <div className="h-4 w-1/3 bg-slate-200 rounded mb-4" />
        <div className="h-8 w-1/2 bg-slate-300 rounded mb-3" />
        <div className="h-3 w-3/4 bg-slate-200 rounded" />
      </div>
    );
  }

  if (!quote) return null;

  const isSurge = quote.surgeMultiplier > 1;
  const isPromo = quote.discountMultiplier < 1;

  return (
    <div className="pixel-card rounded-lg p-5 bg-white border-2 border-pixel-border">
      <div className="flex items-center justify-between border-b-2 border-pixel-border pb-3 mb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-pixel-muted block">
            Báo giá ước tính
          </span>
          <div className="font-mono text-2xl font-black text-pixel-border">
            {formatVND(quote.total)}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          {isSurge ? (
            <PixelBadge variant="red" className="animate-pulse">
              ⚡ Surge {quote.surgeMultiplier}x
            </PixelBadge>
          ) : (
            <PixelBadge variant="green">Chuẩn 1.0x</PixelBadge>
          )}

          {isPromo && (
            <PixelBadge variant="yellow">
              <Tag className="h-3 w-3 mr-0.5" /> Giảm giá
            </PixelBadge>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
        <div className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 p-2.5">
          <Navigation className="h-4 w-4 text-emerald-600" />
          <div>
            <span className="text-slate-500 block text-[10px]">Khoảng cách</span>
            <span className="font-bold text-slate-800">{quote.distanceKm} km</span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 p-2.5">
          <Clock className="h-4 w-4 text-blue-600" />
          <div>
            <span className="text-slate-500 block text-[10px]">Thời gian dự kiến</span>
            <span className="font-bold text-slate-800">{formatDuration(quote.estimatedMinutes)}</span>
          </div>
        </div>
      </div>

      {/* Breakdown details */}
      <div className="text-[11px] text-slate-500 space-y-1 mb-5 border-t border-slate-100 pt-3 font-mono">
        <div className="flex justify-between">
          <span>Chiến lược cước:</span>
          <span className="font-bold text-slate-700">{quote.pricing}</span>
        </div>
        <div className="flex justify-between">
          <span>Thuế VAT:</span>
          <span>{(quote.taxRate * 100).toFixed(0)}%</span>
        </div>
        {isPromo && (
          <div className="flex justify-between text-emerald-600 font-bold">
            <span>Khuyến mãi áp dụng:</span>
            <span>-{((1 - quote.discountMultiplier) * 100).toFixed(0)}%</span>
          </div>
        )}
      </div>

      {/* CTA Button */}
      <button
        type="button"
        disabled={isBooking}
        onClick={onConfirmBooking}
        className="w-full pixel-btn-primary rounded-md py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isBooking ? (
          <span className="inline-flex items-center gap-2">
            <Zap className="h-4 w-4 animate-spin" />
            Đang tạo chuyến...
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            <span>Xác nhận đặt chuyến</span>
            <ArrowRight className="h-4 w-4" />
          </span>
        )}
      </button>
    </div>
  );
}
