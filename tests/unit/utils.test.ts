import { describe, it, expect } from "vitest";
import { formatVND, formatDuration } from "@/lib/utils";
import { haversineDistance } from "@/lib/map/haversine";

describe("Utils tests", () => {
  it("formatVND formats Vietnamese currency correctly", () => {
    const formatted = formatVND(154000);
    // Chuỗi có thể chứa ký tự dấu cách không ngắt (non-breaking space)
    expect(formatted.replace(/\s/g, " ")).toContain("154.000");
  });

  it("formatDuration formats minutes properly", () => {
    expect(formatDuration(0.5)).toBe("< 1 phút");
    expect(formatDuration(18.6)).toBe("19 phút");
    expect(formatDuration(75)).toBe("1h 15m");
  });

  it("haversineDistance calculates Ben Thanh to Phu My Hung around 5km", () => {
    const benThanh = { lat: 10.7721, lng: 106.698 };
    const phuMyHung = { lat: 10.729, lng: 106.719 };
    const dist = haversineDistance(benThanh, phuMyHung);
    expect(dist).toBeGreaterThan(4.5);
    expect(dist).toBeLessThan(6.0);
  });
});
