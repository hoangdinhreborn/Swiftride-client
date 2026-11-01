import type { Metadata } from "next";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "SwiftRide - Nền Tảng Đặt Xe Công Nghệ",
  description: "SwiftRide Ride-Hailing Client - Retro Pixel Modern Experience",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-pixel-bg font-sans text-pixel-dark antialiased">
        <QueryProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            toastOptions={{
              className: "pixel-card font-sans font-medium text-sm",
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
