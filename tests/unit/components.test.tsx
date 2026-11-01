import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PixelBadge } from "@/components/shared/pixel/PixelBadge";
import { PixelStatusBadge } from "@/components/shared/pixel/PixelStatusBadge";
import { PixelStepper } from "@/components/shared/pixel/PixelStepper";

describe("Pixel Components tests", () => {
  it("PixelBadge renders text correctly", () => {
    render(<PixelBadge variant="yellow">SURGE 1.8X</PixelBadge>);
    expect(screen.getByText("SURGE 1.8X")).toBeDefined();
  });

  it("PixelStatusBadge renders Vietnamese label for Requested", () => {
    render(<PixelStatusBadge status="Requested" />);
    expect(screen.getByText(/Chờ xác nhận giá/i)).toBeDefined();
  });

  it("PixelStatusBadge renders Vietnamese label for Paid", () => {
    render(<PixelStatusBadge status="Paid" />);
    expect(screen.getByText(/ĐÃ HOÀN TẤT & THANH TOÁN/i)).toBeDefined();
  });

  it("PixelStepper displays workflow steps", () => {
    render(<PixelStepper currentStatus="PickedUp" />);
    expect(screen.getByText("Báo giá")).toBeDefined();
    expect(screen.getByText("Đề xuất")).toBeDefined();
    expect(screen.getByText("Tài xế nhận")).toBeDefined();
    expect(screen.getByText("Đang đi")).toBeDefined();
    expect(screen.getByText("Đã đến")).toBeDefined();
    expect(screen.getByText("Hoàn tất")).toBeDefined();
  });
});
