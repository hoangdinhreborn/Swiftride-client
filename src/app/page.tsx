import Link from "next/link";
import { Car, MapPin, ShieldCheck, ArrowRight, Zap, Database, Activity } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col pixel-grid-bg">
      {/* Navigation Top */}
      <header className="border-b-2 border-pixel-border bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded border-2 border-pixel-border bg-taxi p-1.5 shadow-pixel-sm">
              <Car className="h-5 w-5 text-pixel-border" />
            </div>
            <span className="font-mono text-xl font-black text-pixel-border">SWIFTRIDE</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login?role=Rider"
              className="pixel-btn-secondary rounded px-3 py-1.5 text-xs font-bold"
            >
              Rider Login
            </Link>
            <Link
              href="/login?role=Driver"
              className="pixel-btn-primary rounded px-3 py-1.5 text-xs font-bold"
            >
              Driver Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 px-4 py-12">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-pixel-border bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 shadow-pixel-sm">
            <Zap className="h-3.5 w-3.5 text-amber-600" />
            <span>Next.js 16.4.3 App Router + .NET 10 Microservices</span>
          </div>

          <h1 className="mb-4 font-mono text-3xl font-black tracking-tight text-pixel-border sm:text-5xl">
            ĐẶT XE CÔNG NGHỆ <br />
            <span className="bg-taxi px-2 text-pixel-border">CHUẨN MICROSERVICES</span>
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Hệ thống sàn giao dịch gọi xe 2 phía (Two-Sided Marketplace). Trải nghiệm đặt xe thời gian thực,
            tính giá động (Surge Pricing) bằng MongoDB Geo-Spatial, vòng đời chuyến đi Transactional Outbox
            và sổ cái kế toán Double-Entry.
          </p>

          {/* Action Cards */}
          <div className="grid gap-6 sm:grid-cols-2 text-left mb-12">
            {/* Rider Card */}
            <div className="pixel-card rounded-lg p-6 flex flex-col justify-between">
              <div>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg border-2 border-pixel-border bg-taxi shadow-pixel-sm">
                  <MapPin className="h-6 w-6 text-pixel-border" />
                </div>
                <h2 className="text-xl font-black text-pixel-border mb-2 font-mono">
                  Dành cho Rider
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Chọn điểm đón & điểm đến trên bản đồ Leaflet OpenStreetMap. Nhận báo giá tức thì với
                  thuật toán Route Estimator và theo dõi xe tài xế theo thời gian thực.
                </p>
              </div>

              <Link
                href="/login?role=Rider"
                className="pixel-btn-primary rounded-md py-3 px-4 flex items-center justify-between text-sm font-bold"
              >
                <span>Vào ứng dụng Đặt xe</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Driver Card */}
            <div className="pixel-card rounded-lg p-6 flex flex-col justify-between">
              <div>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg border-2 border-pixel-border bg-emerald-400 shadow-pixel-sm">
                  <Car className="h-6 w-6 text-pixel-border" />
                </div>
                <h2 className="text-xl font-black text-pixel-border mb-2 font-mono">
                  Dành cho Driver
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Bật định vị GPS Geolocation để cập nhật vị trí lên MongoDB. Nhận chuyến đi trong bán
                  kính 5km, thực hiện quy trình Đón khách $\rightarrow$ Trả khách an toàn.
                </p>
              </div>

              <Link
                href="/login?role=Driver"
                className="pixel-btn-secondary rounded-md py-3 px-4 flex items-center justify-between text-sm font-bold"
              >
                <span>Vào bảng điều khiển Tài xế</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Architecture highlights */}
          <div className="rounded-lg border-2 border-pixel-border bg-white p-6 shadow-pixel text-left">
            <h3 className="text-sm font-bold uppercase tracking-wider text-pixel-muted mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-taxi" />
              <span>Hạ tầng Microservices kết nối</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="rounded border border-slate-200 bg-slate-50 p-3">
                <span className="font-bold block text-slate-800">API Gateway</span>
                <span className="text-[11px] text-slate-500">YARP Port 5000</span>
              </div>
              <div className="rounded border border-slate-200 bg-slate-50 p-3">
                <span className="font-bold block text-slate-800">TripService</span>
                <span className="text-[11px] text-slate-500">PostgreSQL (tripdb)</span>
              </div>
              <div className="rounded border border-slate-200 bg-slate-50 p-3">
                <span className="font-bold block text-slate-800">MatchingService</span>
                <span className="text-[11px] text-slate-500">MongoDB (matchdb)</span>
              </div>
              <div className="rounded border border-slate-200 bg-slate-50 p-3">
                <span className="font-bold block text-slate-800">PaymentService</span>
                <span className="text-[11px] text-slate-500">PostgreSQL (paydb)</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-pixel-border bg-white py-4 text-center text-xs text-slate-500">
        <div className="flex items-center justify-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>SwiftRide Platform - Clean Architecture & Microservices 2026</span>
        </div>
      </footer>
    </div>
  );
}
