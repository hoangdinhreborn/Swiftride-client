"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks";
import { Car, LogOut, User } from "lucide-react";
import { PixelBadge } from "@/components/shared/pixel/PixelBadge";

interface Props {
  role: "Rider" | "Driver";
}

export function AppNavbar({ role }: Props) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="border-b-2 border-pixel-border bg-white px-4 py-3 shadow-sm sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Brand */}
        <Link href={role === "Rider" ? "/rider" : "/driver"} className="flex items-center gap-2">
          <div className="rounded border-2 border-pixel-border bg-taxi p-1 shadow-pixel-sm">
            <Car className="h-5 w-5 text-pixel-border" />
          </div>
          <span className="font-mono text-lg font-black text-pixel-border">SWIFTRIDE</span>
          <PixelBadge variant={role === "Rider" ? "yellow" : "green"}>{role}</PixelBadge>
        </Link>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-mono text-slate-700">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <span>{user?.name || `${role} #active`}</span>
          </div>

          <button
            onClick={handleLogout}
            title="Đăng xuất"
            className="pixel-btn-secondary flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-red-600"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Thoát</span>
          </button>
        </div>
      </div>
    </header>
  );
}
