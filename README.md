# SwiftRide Client - Nền Tảng Đặt Xe Công Nghệ (Next.js 16.4.3)

Ứng dụng Web Client hiện đại dành cho hệ thống đặt xe công nghệ **SwiftRide**, phát triển bằng **Next.js 16.4.3 (App Router)**, **React 19**, **TypeScript** và **Tailwind CSS**, tích hợp trực tiếp với hệ sinh thái Microservices Backend (.NET 10) thông qua API Gateway YARP.

Phong cách thiết kế: **Modern Ride-Hailing Platform + Retro Pixel Art (Taste & Impeccable Guidelines)**.

---

## 1. Công Nghệ Sử Dụng (Tech Stack)

| Thành phần | Công nghệ & Phiên bản | Vai trò & Tính năng |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16.4.3** | App Router, Server Components & Route Handlers BFF vá các lỗ hổng bảo mật. |
| **UI Library** | **React 19.3.1** | Thư viện giao diện người dùng mới nhất. |
| **Language** | **TypeScript 5.9** | Chế độ `strict: true`, đảm bảo type-safety tuyệt đối. |
| **Styling** | **Tailwind CSS 3.4** | Design tokens tùy chỉnh với xúc giác Retro Pixel Art (`pixel-card`, `pixel-btn`). |
| **Bản đồ** | **Leaflet & React Leaflet** | Bản đồ OpenStreetMap, custom marker pixel xe taxi xoay theo hướng di chuyển. |
| **Server State** | **TanStack Query v5** | Quản lý cache và Polling chu kỳ 3s theo dõi trạng thái chuyến đi. |
| **Client State** | **Zustand v5** | Lưu trữ trạng thái phiên làm việc và Active Trip ID. |
| **Bảo mật (Auth)** | **BFF + HttpOnly Cookie** | JWT Bearer được bảo vệ trong HttpOnly cookie, không bao giờ lộ trong JavaScript. |
| **Kiểm thử** | **Vitest & Playwright** | Kiểm thử Unit / Component và kịch bản End-to-End hai chiều Rider & Driver. |

---

## 2. Hướng Dẫn Cài Đặt & Khởi Chạy

### Yêu cầu tiên quyết:
- Đã khởi động cụm Backend `swiftride-server` (ít nhất là API Gateway cổng `5000` và các microservice).
  ```bash
  cd swiftride-server
  docker compose up -d --build
  ```

### Các bước khởi chạy Client:
```bash
cd swiftride-client

# 1. Cài đặt các gói phụ thuộc:
pnpm install

# 2. Khởi động môi trường phát triển:
pnpm dev
```
Ứng dụng sẽ hoạt động tại: **`http://localhost:3000`**

---

## 3. Trải Nghiệm Hai Ứng Dụng (Rider & Driver)

Khuyến nghị: Mở **1 cửa sổ thông thường** cho Rider và **1 cửa sổ ẩn danh (Incognito)** cho Driver để trải nghiệm tương tác thời gian thực:

### 3.1. Dành cho Rider (`http://localhost:3000/rider`)
1. Đăng nhập với quyền **Rider**.
2. Chọn Điểm đón (ví dụ: Chợ Bến Thành) và Điểm đến (ví dụ: Phú Mỹ Hưng) trực tiếp trên bản đồ Leaflet hoặc danh sách gợi ý.
3. MatchingService sẽ tự động tính toán cước phí theo công thức:
   $$p = ((c_d \cdot d + c_t \cdot t) \cdot s + c_m) \cdot \eta \cdot (1 + T)$$
   Hiển thị rõ ràng hệ số Surge cao điểm, mã giảm giá `SWIFT10`, thuế VAT 8% và tổng tiền.
4. Bấm **"Xác nhận đặt chuyến"** $\rightarrow$ Hệ thống chuyển sang màn hình theo dõi hành trình (`/rider/track/[id]`).

### 3.2. Dành cho Driver (`http://localhost:3000/driver`)
1. Mở cửa sổ ẩn danh, đăng nhập với quyền **Driver**.
2. Bật công tắc **"Đang Online"** để GPS Geolocation tự động cập nhật vị trí xe của bạn lên MongoDB `MatchDb`.
3. Sao chép mã chuyến (Trip ID) từ tab Rider dán vào ô tìm kiếm.
4. Thực hiện các bước trong vòng đời chuyến đi:
   - **Chấp nhận chuyến (Accept)**: Chuyển sang `DriverAccepted`.
   - **Đón khách (Pick Up)**: Chuyển sang `PickedUp`.
   - **Trả khách (Drop Off)**: Chuyển sang `DroppedOff`.
5. Khi trả khách thành công:
   - `TripService` tự động ghi bản ghi Outbox `RideCompletedEvent`.
   - `RabbitMQ` chuyển sự kiện sang `PaymentService` để trừ tiền.
   - Quay lại tab Rider, bấm **"Thanh toán ngay"** hoặc chờ Outbox Saga tự động xử lý.
   - Khi thanh toán hoàn tất, màn hình Rider tự động đóng dấu biên lai điện tử **`PAID`**!

---

## 4. Kiểm Thử Hệ Thống (Testing)

### Chạy Unit & Component Tests (Vitest):
```bash
pnpm test
```
Kiểm tra các hàm tiện ích, định dạng tiền tệ VND, giải mã JWT và render các linh kiện Pixel.

### Chạy End-to-End Tests (Playwright):
```bash
pnpm test:e2e
```
Chạy kịch bản tự động hóa mô phỏng toàn bộ luồng từ đăng nhập đến nhận cuốc xe.
