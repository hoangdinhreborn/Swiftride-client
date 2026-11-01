import { PixelBadge } from "./PixelBadge";
import type { TripStatus } from "@/types/backend";

interface Props {
  status: TripStatus | string;
  className?: string;
}

export function PixelStatusBadge({ status, className }: Props) {
  switch (status) {
    case "Requested":
      return (
        <PixelBadge variant="yellow" className={className}>
          ● Đang tìm tài xế
        </PixelBadge>
      );
    case "DriverAccepted":
      return (
        <PixelBadge variant="blue" className={className}>
          ● Tài xế đang đến
        </PixelBadge>
      );
    case "PickedUp":
      return (
        <PixelBadge variant="green" className={className}>
          ● Đang di chuyển
        </PixelBadge>
      );
    case "DroppedOff":
      return (
        <PixelBadge variant="yellow" className={className}>
          ● Đã trả khách / Chờ thanh toán
        </PixelBadge>
      );
    case "Paid":
      return (
        <PixelBadge variant="green" className={className}>
          ✓ ĐÃ HOÀN TẤT & THANH TOÁN
        </PixelBadge>
      );
    case "Cancelled":
      return (
        <PixelBadge variant="outline" className={className}>
          ✕ Đã hủy
        </PixelBadge>
      );
    case "Failed":
      return (
        <PixelBadge variant="red" className={className}>
          ✕ Thất bại
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
