export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;

export function haversineDistance(from: LatLng, to: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLon = toRad(to.lng - from.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export const PRESET_LOCATIONS: { name: string; lat: number; lng: number }[] = [
  { name: "Chợ Bến Thành (Quận 1)", lat: 10.7721, lng: 106.698 },
  { name: "Phú Mỹ Hưng (Quận 7)", lat: 10.729, lng: 106.719 },
  { name: "Đại học Sài Gòn (Quận 5)", lat: 10.7599, lng: 106.6787 },
  { name: "Landmark 81 (Bình Thạnh)", lat: 10.795, lng: 106.7218 },
  { name: "Sân bay Tân Sơn Nhất", lat: 10.8188, lng: 106.6518 },
];
