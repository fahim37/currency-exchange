"use client";
import { useLocale } from "@/components/providers";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  const { t } = useLocale();
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 p-8 text-center">
      <h1 className="text-2xl font-semibold">
        {t("সংযোগে একটু সমস্যা হচ্ছে।", "A small bump in the road.")}
      </h1>
      <p className="text-sm text-muted-foreground">
        {t("একটু পর আবার চেষ্টা করুন।", "Please try again in a moment.")}
      </p>
      <Button onClick={reset}>{t("আবার চেষ্টা করুন", "Try again")}</Button>
    </div>
  );
}
