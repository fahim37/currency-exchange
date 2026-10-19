"use client";
import { LoaderCircle, RefreshCw, Inbox } from "lucide-react";
import { useLocale } from "./providers";
import { Button } from "./ui/button";
import { errorText } from "@/lib/client-api";
export function ResourceState({
  loading,
  error,
  retry,
  empty,
}: {
  loading?: boolean;
  error?: unknown;
  retry?: () => void;
  empty?: boolean;
}) {
  const { t, locale } = useLocale();
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed bg-card p-8 text-center">
      {loading ? (
        <LoaderCircle className="size-6 animate-spin text-primary" />
      ) : empty ? (
        <Inbox className="size-7 text-muted-foreground" />
      ) : (
        <RefreshCw className="size-6 text-muted-foreground" />
      )}
      <p
        role={error ? "alert" : "status"}
        className="text-sm text-muted-foreground"
      >
        {loading
          ? t("লোড হচ্ছে…", "Loading your workspace…")
          : empty
            ? t("এখনও কোনো তথ্য নেই।", "Nothing here just yet.")
            : errorText(error, locale)}
      </p>
      {Boolean(error) && retry && (
        <Button size="sm" variant="outline" onClick={retry}>
          {t("আবার চেষ্টা করুন", "Try again")}
        </Button>
      )}
    </div>
  );
}
