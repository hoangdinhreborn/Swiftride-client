import { cn } from "@/lib/utils";
import { Check, Clock, Car, Navigation, CreditCard, Sparkles } from "lucide-react";
import type { TripStatus } from "@/types/backend";

interface Props {
  currentStatus: TripStatus | string;
}

const STEPS = [
  { key: "Requested", label: "Tìm xe", icon: Clock },
  { key: "DriverAccepted", label: "Tài xế nhận", icon: Car },
  { key: "PickedUp", label: "Đang đi", icon: Navigation },
  { key: "DroppedOff", label: "Đã đến", icon: CreditCard },
  { key: "Paid", label: "Hoàn tất", icon: Sparkles },
];

function getStepIndex(status: string): number {
  switch (status) {
    case "Requested":
      return 0;
    case "DriverAccepted":
      return 1;
    case "PickedUp":
      return 2;
    case "DroppedOff":
      return 3;
    case "Paid":
      return 4;
    default:
      return 0;
  }
}

export function PixelStepper({ currentStatus }: Props) {
  const currentIndex = getStepIndex(currentStatus);
  const isFailedOrCancelled = currentStatus === "Cancelled" || currentStatus === "Failed";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {STEPS.map((step, idx) => {
          const isDone = !isFailedOrCancelled && idx < currentIndex;
          const isCurrent = !isFailedOrCancelled && idx === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex flex-1 flex-col items-center relative">
              {/* Line connector */}
              {idx > 0 && (
                <div
                  className={cn(
                    "absolute top-4 -left-1/2 w-full h-[3px] -z-0 border-t-2 border-dashed transition-colors",
                    idx <= currentIndex
                      ? "border-pixel-border bg-taxi"
                      : "border-slate-300"
                  )}
                />
              )}

              {/* Node */}
              <div
                className={cn(
                  "relative z-10 flex h-8 w-8 items-center justify-center rounded border-2 border-pixel-border transition-all",
                  isDone
                    ? "bg-emerald-400 text-pixel-border shadow-pixel-sm"
                    : isCurrent
                    ? "bg-taxi text-pixel-border ring-2 ring-pixel-border shadow-pixel animate-pulse"
                    : "bg-white text-slate-400"
                )}
              >
                {isDone ? (
                  <Check className="h-4 w-4 stroke-[3]" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "mt-2 text-[11px] font-bold text-center",
                  isCurrent
                    ? "text-pixel-border font-mono underline decoration-taxi decoration-2"
                    : isDone
                    ? "text-emerald-700"
                    : "text-slate-400"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
