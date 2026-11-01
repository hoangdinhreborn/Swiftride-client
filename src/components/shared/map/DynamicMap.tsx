"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type LeafletInnerMap from "./LeafletInnerMap";

// Dynamic import với ssr: false để tránh lỗi window undefined khi prerender
const LeafletMap = dynamic(() => import("./LeafletInnerMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center border-2 border-pixel-border bg-slate-100 font-mono text-xs text-pixel-muted">
      <div className="flex flex-col items-center gap-2">
        <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-pixel-border border-t-taxi" />
        <span>ĐANG TẢI BẢN ĐỒ OPENSTREETMAP...</span>
      </div>
    </div>
  ),
});

export function DynamicMap(props: ComponentProps<typeof LeafletInnerMap>) {
  return <LeafletMap {...props} />;
}
