import { PixelBadge } from "./PixelBadge";
import type { TripStatus } from "@/types";
import { Clock, Car, Navigation, CreditCard, CheckCircle2, XCircle, AlertCircle, Search, UserCheck } from "lucide-react";

interface Props {
  status: TripStatus | string;
  className?: string;
}

export function PixelStatusBadge({ status, className }: Props) {
  switch (status) {
    case "Requested":
      return (
        <PixelBadge variant="yellow" className={className}>
          <Clock className="h-3 w-3 mr-1" />
          <span>Chờ xác nhận giá</span>
        </PixelBadge>
      );
    case "Searching":
      return (
        <PixelBadge variant="blue" className={className}>
          <Search className="h-3 w-3 mr-1 animate-spin" />
          <span>Đang tìm tài xế gần</span>
        </PixelBadge>
      );
    case "DriverOffered":
      return (
        <PixelBadge variant="yellow" className={className}>
          <UserCheck className="h-3 w-3 mr-1" />
          <span>Đã đề xuất cho tài xế</span>
        </PixelBadge>
      );
    case "DriverAccepted":
      return (
        <PixelBadge variant="blue" className={className}>
          <Car className="h-3 w-3 mr-1" />
          <span>Tài xế đã nhận cuốc</span>
        </PixelBadge>
      );
    case "EnRoute":
      return (
        <PixelBadge variant="blue" className={className}>
          <Car className="h-3 w-3 mr-1 animate-pulse" />
          <span>Tài xế đang đến đón</span>
        </PixelBadge>
      );
    case "PickedUp":
      return (
        <PixelBadge variant="green" className={className}>
          <Navigation className="h-3 w-3 mr-1" />
          <span>Đang di chuyển</span>
        </PixelBadge>
      );
    case "DroppedOff":
      return (
        <PixelBadge variant="yellow" className={className}>
          <CreditCard className="h-3 w-3 mr-1" />
          <span>Đã đến nơi / Chờ thanh toán</span>
        </PixelBadge>
      );
    case "PaymentPending":
      return (
        <PixelBadge variant="yellow" className={className}>
          <Clock className="h-3 w-3 mr-1" />
          <span>Đang trừ tiền...</span>
        </PixelBadge>
      );
    case "Paid":
      return (
        <PixelBadge variant="green" className={className}>
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
          <span>ĐÃ HOÀN TẤT & THANH TOÁN</span>
        </PixelBadge>
      );
    case "Cancelled":
      return (
        <PixelBadge variant="outline" className={className}>
          <XCircle className="h-3 w-3 mr-1" />
          <span>Đã hủy chuyến</span>
        </PixelBadge>
      );
    case "Failed":
      return (
        <PixelBadge variant="red" className={className}>
          <AlertCircle className="h-3 w-3 mr-1" />
          <span>Không thành công</span>
        </PixelBadge>
      );
    default:
      return (
        <PixelBadge variant="outline" className={className}>
          {status}
        </PixelBadge>
      );
  }
}
