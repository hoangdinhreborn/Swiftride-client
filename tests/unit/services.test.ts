import { describe, it, expect, vi } from "vitest";
import { tripService } from "@/services/trip.service";
import { matchingService } from "@/services/matching.service";
import { paymentService } from "@/services/payment.service";
import { routingService } from "@/services/routing.service";
import { apiClient } from "@/lib/api-client";

describe("Services API Layer tests", () => {
  it("tripService.getTrip calls apiClient.get with correct path", async () => {
    const spy = vi.spyOn(apiClient, "get").mockResolvedValueOnce({
      id: "trip-123",
      status: "Requested",
    } as any);

    const trip = await tripService.getTrip("trip-123");
    expect(spy).toHaveBeenCalledWith("/trips/trip-123");
    expect(trip.id).toBe("trip-123");
  });

  it("matchingService.getQuote calls apiClient.post with quote request", async () => {
    const spy = vi.spyOn(apiClient, "post").mockResolvedValueOnce({
      total: 108000,
      pricing: "Standard",
    } as any);

    const quoteReq = {
      pickupLat: 10.77,
      pickupLng: 106.69,
      destinationLat: 10.72,
      destinationLng: 106.71,
    };
    const res = await matchingService.getQuote(quoteReq);
    expect(spy).toHaveBeenCalledWith("/quote", quoteReq);
    expect(res.total).toBe(108000);
  });

  it("paymentService.createPayment generates an Idempotency-Key header", async () => {
    const spy = vi.spyOn(apiClient, "post").mockResolvedValueOnce({
      id: "pay-1",
      status: "Succeeded",
    } as any);

    await paymentService.createPayment({
      tripId: "trip-1",
      paymentToken: "tok_visa",
      idempotencyKey: "custom-key-123",
    });

    expect(spy).toHaveBeenCalledWith(
      "/payments",
      { tripId: "trip-1", paymentToken: "tok_visa" },
      { headers: { "Idempotency-Key": "custom-key-123" } }
    );
  });

  it("routingService.getRoute returns turn-by-turn road coordinates", async () => {
    // Mock global fetch
    const mockOsrmResponse = {
      code: "Ok",
      routes: [
        {
          distance: 7450,
          duration: 550,
          geometry: {
            coordinates: [
              [106.698, 10.772],
              [106.705, 10.765],
              [106.719, 10.729],
            ],
          },
        },
      ],
    };

    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mockOsrmResponse,
    } as any);

    const route = await routingService.getRoute({ lat: 10.772, lng: 106.698 }, { lat: 10.729, lng: 106.719 });
    expect(route).not.toBeNull();
    // Tọa độ phải được đổi thứ tự [lat, lng] cho Leaflet
    expect(route?.coordinates[0]).toEqual([10.772, 106.698]);
    expect(route?.coordinates[2]).toEqual([10.729, 106.719]);
    expect(route?.distanceMeters).toBe(7450);

    fetchSpy.mockRestore();
  });
});
