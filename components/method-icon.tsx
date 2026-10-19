import { cn } from "@/lib/utils";
export function MethodIcon({
  name,
  color,
  className,
}: {
  name: string;
  color?: string;
  className?: string;
}) {
  const key = name.toLowerCase();
  const brandColor =
    color ||
    (key.includes("bkash")
      ? "#e2136e"
      : key.includes("nagad")
        ? "#ed5125"
        : key.includes("payoneer")
          ? "#ff672b"
          : key.includes("skrill")
            ? "#7d2671"
            : "#26a17b");
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold",
        className,
      )}
      style={{ color: brandColor, background: `${brandColor}12` }}
    >
      {key.includes("bkash") ? (
        <svg viewBox="0 0 32 32" className="size-7" fill="currentColor">
          <path d="m5 7 23 7-12 5L5 7Zm0 0 7 17 4-5L5 7Zm12 14 5 5 3-10-8 5Z" />
        </svg>
      ) : key.includes("nagad") ? (
        <svg
          viewBox="0 0 32 32"
          className="size-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <circle cx="16" cy="16" r="10" />
          <path d="m10 19 6-11 6 11M12 16h8" />
        </svg>
      ) : key.includes("tether") || key.includes("usdt") ? (
        "₮"
      ) : key.includes("payoneer") ? (
        "P"
      ) : key.includes("skrill") ? (
        "S"
      ) : (
        name.slice(0, 1)
      )}
    </span>
  );
}
