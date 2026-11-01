"use client";

import { useState, useTransition, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks";
import { toast } from "sonner";
import { Car, UserCheck, ShieldCheck, Zap, Sparkles } from "lucide-react";
import type { UserRole } from "@/types";

function DirectLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = (searchParams.get("role") as UserRole) || "Rider";
  const redirectPath = searchParams.get("redirect");

  const [role, setRole] = useState<UserRole>(initialRole === "Driver" ? "Driver" : "Rider");
  const [customUserId, setCustomUserId] = useState<string>("");
  const [useCustomId, setUseCustomId] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  const { user, isAuthenticated, login, isLoading } = useAuth();

  // Nếu người dùng đã đăng nhập, tự động chuyển vào dashboard tương ứng
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const target = redirectPath || (user.role === "Driver" ? "/driver" : "/rider");
      router.replace(target);
    }
  }, [isLoading, isAuthenticated, user, redirectPath, router]);

  const handleLogin = (selectedRole?: UserRole) => {
    const targetRole = selectedRole || role;
    startTransition(async () => {
      try {
        const userId = useCustomId && customUserId.trim() ? customUserId.trim() : undefined;
        const loggedInUser = await login(targetRole, userId);
        toast.success(`Đăng nhập thành công!`, {
          description: `Chào mừng ${loggedInUser.name} (${loggedInUser.role})`,
        });

        const target = redirectPath || (targetRole === "Driver" ? "/driver" : "/rider");
        router.push(target);
      } catch (err: unknown) {
        toast.error("Không thể đăng nhập", {
          description: (err as Error).message,
        });
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center pixel-grid-bg p-4">
      <div className="w-full max-w-md">
        {/* Header Logo */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 rounded border-2 border-pixel-border bg-taxi px-4 py-2 shadow-pixel">
            <Car className="h-6 w-6 text-pixel-border" />
            <span className="font-mono text-xl font-black tracking-wider text-pixel-border">
              SWIFTRIDE
            </span>
          </div>
          <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-pixel-muted">
            Microservices Ride-Hailing Platform
          </p>
        </div>

        {/* Card đăng nhập chính */}
        <div className="pixel-card rounded-lg p-6 bg-white">
          <div className="mb-6 border-b-2 border-pixel-border pb-4">
            <h1 className="text-xl font-bold tracking-tight text-pixel-border">
              Chọn vai trò trải nghiệm
            </h1>
            <p className="text-xs text-pixel-muted mt-1">
              Đăng nhập qua API Gateway YARP (Port 5000) & Goong.io Maps
            </p>
          </div>

          {/* Role selector tabs */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setRole("Rider")}
              className={`flex flex-col items-center gap-2 rounded border-2 border-pixel-border p-4 font-bold transition-all ${
                role === "Rider"
                  ? "bg-taxi text-pixel-border shadow-pixel-sm translate-x-[1px] translate-y-[1px]"
                  : "bg-white text-pixel-muted hover:bg-slate-50 shadow-pixel"
              }`}
            >
              <UserCheck className="h-7 w-7" />
              <span>Rider (Đặt xe)</span>
              <span className="text-[10px] font-normal opacity-80">Gọi xe & Bản đồ</span>
            </button>

            <button
              type="button"
              onClick={() => setRole("Driver")}
              className={`flex flex-col items-center gap-2 rounded border-2 border-pixel-border p-4 font-bold transition-all ${
                role === "Driver"
                  ? "bg-pixel-green text-white shadow-pixel-sm translate-x-[1px] translate-y-[1px]"
                  : "bg-white text-pixel-muted hover:bg-slate-50 shadow-pixel"
              }`}
            >
              <Car className="h-7 w-7" />
              <span>Driver (Tài xế)</span>
              <span className="text-[10px] font-normal opacity-80">Nhận cuốc & GPS</span>
            </button>
          </div>

          {/* Tùy chọn nâng cao User ID */}
          <div className="mb-6 rounded border border-slate-200 bg-slate-50 p-3">
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={useCustomId}
                onChange={(e) => setUseCustomId(e.target.checked)}
                className="rounded border-pixel-border"
              />
              <span>Tùy chỉnh User ID (UUID)</span>
            </label>

            {useCustomId && (
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="e.g. 59ef9d6b-f959-4cca-9443-fa4a5777bca4"
                  value={customUserId}
                  onChange={(e) => setCustomUserId(e.target.value)}
                  className="w-full rounded border-2 border-pixel-border bg-white p-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-taxi"
                />
                <button
                  type="button"
                  onClick={() => setCustomUserId(crypto.randomUUID())}
                  className="mt-1 text-[11px] text-blue-600 hover:underline"
                >
                  Tạo UUID ngẫu nhiên
                </button>
              </div>
            )}
          </div>

          {/* Action button */}
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleLogin()}
            className="w-full pixel-btn-primary flex items-center justify-center gap-2 rounded-md py-3 text-sm tracking-wide disabled:opacity-50"
          >
            {isPending ? (
              <span className="inline-flex items-center gap-2">
                <Zap className="h-4 w-4 animate-spin" />
                Đang cấp phát token qua Gateway...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Đăng nhập ngay với quyền {role}
              </span>
            )}
          </button>

          {/* Footer security badges */}
          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-pixel-muted">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Token được tự động inject vào mọi request tới Gateway</span>
          </div>
        </div>

        {/* Quick hint box */}
        <div className="mt-4 text-center text-xs text-slate-500">
          Chạy 2 tài khoản: Mở thêm 1 cửa sổ ẩn danh (Incognito) để đóng vai Tài xế và Người đi xe.
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-mono text-xs">ĐANG TẢI GIAO DIỆN...</div>}>
      <DirectLoginContent />
    </Suspense>
  );
}
