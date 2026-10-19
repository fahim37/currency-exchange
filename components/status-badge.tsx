"use client";
import { Check, Clock3, LoaderCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "./providers";
export function StatusBadge({ status }: { status: string }) {
  const { t } = useLocale();
  const completed = status === "COMPLETED",
    processing = status === "PROCESSING",
    cancelled = status === "CANCELLED";
  const Icon = completed
    ? Check
    : processing
      ? LoaderCircle
      : cancelled
        ? X
        : Clock3;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium",
        completed
          ? "border-emerald-500/15 bg-emerald-500/8 text-emerald-700 dark:text-emerald-400"
          : processing
            ? "border-blue-500/15 bg-blue-500/8 text-blue-700 dark:text-blue-400"
            : cancelled
              ? "border-red-500/15 bg-red-500/8 text-red-700 dark:text-red-400"
              : "border-amber-500/15 bg-amber-500/8 text-amber-700 dark:text-amber-400",
      )}
    >
      <Icon className="size-3" />
      {completed
        ? t("সম্পন্ন", "Completed")
        : processing
          ? t("প্রসেসিং", "Processing")
          : cancelled
            ? t("বাতিল", "Cancelled")
            : t("অপেক্ষমাণ", "Pending")}
    </span>
  );
}
