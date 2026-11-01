# SwiftRide Client - Nền Tảng Đặt Xe Công Nghệ (Next.js 16.4.3)

Ứng dụng Web Client hiện đại dành cho hệ thống đặt xe công nghệ **SwiftRide**, phát triển bằng **Next.js 16.4.3 (App Router)**, **React 19**, **TypeScript** và **Tailwind CSS**, tích hợp trực tiếp với hệ sinh thái Microservices Backend (.NET 10) thông qua duy nhất **API Gateway YARP (Port 5000)**.

Phong cách thiết kế: **Modern Ride-Hailing Platform + Retro Pixel Art (Taste & Impeccable Guidelines)**.

---

## 1. Kiến Trúc Mã Nguồn Chuẩn Hóa (Clean Frontend Architecture)

Hệ thống được tổ chức phân tầng rõ ràng, tách biệt giữa Giao diện (Presentation), Nghiệp vụ (Application / Hooks), API Services và Domain Types:

```text
swiftride-client/
├── next.config.ts                                   # Rewrites /gateway/:path* -> http://localhost:5000/:path*
├── package.json                                     # Next.js 16.4.3, React 19, Tailwind, TanStack Query...
│
├── src/
│   ├── app/                                         # [Presentation Layer: Giao diện thuần túy]
│   │   ├── (auth)/login/page.tsx                    # Đăng nhập Rider / Driver
│   │   ├── (rider)/rider/page.tsx                   # Đặt xe (chỉ gọi hooks, không dính logic fetch)
│   │   ├── (rider)/rider/track/[id]/page.tsx        # Theo dõi chuyến & Thanh toán cước
│   │   ├── (driver)/driver/page.tsx                 # Bảng điều khiển tài xế (Radar, Nhận chuyến, Đón/Trả)
│   │   ├── layout.tsx, globals.css, page.tsx
│   │
│   ├── services/                                    # [Services Layer: Các hàm API nghiệp vụ qua Gateway]
│   │   ├── auth.service.ts                          # login(), logout()
│   │   ├── trip.service.ts                          # requestTrip(), getTrip(), acceptTrip(), pickup(), dropoff()
│   │   ├── matching.service.ts                      # getQuote(), matchDrivers(), updateLocation()
│   │   ├── payment.service.ts                       # createPayment(), getPayment()
│   │   └── index.ts                                 # Barrel export
│   │
│   ├── hooks/                                       # [Custom Hooks Layer: Đóng gói TanStack Query & Logic]
│   │   ├── useAuth.ts                               # useAuth() - Quản lý phiên và đăng nhập
│   │   ├── useTrip.ts                               # useTrip(id) - Polling 3s, useCreateTrip()
│   │   ├── useTripActions.ts                        # useTripActions(id) - accept, pickup, dropoff
│   │   ├── useQuote.ts                              # useQuote(coords) - Báo giá cước tự động
│   │   ├── useNearbyDrivers.ts                      # useNearbyDrivers(coords) - Quét xe xung quanh
│   │   ├── useDriverLocation.ts                     # useDriverLocation() - GPS watcher tự động
│   │   ├── usePayment.ts                            # usePayment() - Trừ tiền & Đồng bộ sổ cái
│   │   └── index.ts                                 # Barrel export
│   │
│   ├── lib/
│   │   ├── api-client.ts                            # Unified Fetch Client: TỰ GẮN TOKEN & BẮT LỖI
│   │   ├── errors.ts                                # Xử lý RFC 7807 ProblemDetails
│   │   ├── map/haversine.ts                         # Khoảng cách Haversine & địa điểm mẫu
│   │   └── utils.ts                                 # cn, formatVND, formatDate
│   │
│   ├── types/                                       # [Domain Types: Phân tách theo Bounded Context]
│   │   ├── trip.types.ts                            # TripDto, TripStatus, RequestTripRequest
│   │   ├── matching.types.ts                        # QuoteDto, GetQuoteRequest, NearbyDriverDto
│   │   ├── payment.types.ts                         # PaymentDto, PaymentStatus, CreatePaymentRequest
│   │   ├── auth.types.ts                            # UserSession, UserRole, LoginRequest
│   │   ├── api.types.ts                             # ProblemDetails
│   │   └── index.ts                                 # Barrel export: import { TripDto } from "@/types"
│   │
│   ├── stores/                                      # [Client State: Zustand]
│   │   └── auth.store.ts                            # useAuthStore (user, token, setAuth, logout)
│   │
│   └── components/                                  # [Shared & UI Components]
│       ├── shared/map/DynamicMap.tsx                # Bản đồ Leaflet SSR-safe
│       ├── shared/pixel/                            # PixelBadge, PixelStepper, PixelStatusBadge
│       └── layout/AppNavbar.tsx
│
├── tests/
│   ├── unit/                                        # Vitest (12 tests passed)
│   └── e2e/                                         # Playwright E2E tests
```

---

## 2. Hướng Dẫn Cài Đặt & Khởi Chạy

### Yêu cầu tiên quyết:
Backend Gateway đang chạy tại cổng `5000`:
```bash
cd swiftride-server
docker compose up -d --build
```

### Chạy Client:
```bash
cd swiftride-client
pnpm install
pnpm dev
```
Truy cập: **`http://localhost:3000`**

- **Rider URL**: `http://localhost:3000/rider`
- **Driver URL**: `http://localhost:3000/driver`
- **Login URL**: `http://localhost:3000/login`

---

## 3. Kiểm Thử Hệ Thống

```bash
# Chạy toàn bộ 12 Unit & Component Tests:
pnpm test

# Kiểm tra biên dịch Production:
pnpm build
```
Biên dịch thành công 100% với Turbopack (Next.js 16.4.3).
