"use client";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { Logo } from "./site-header";
import { useLocale } from "./providers";
import { siteConfig } from "@/lib/config";
export function SiteFooter() {
  const { t } = useLocale();
  return (
    <footer className="border-t bg-card">
      <div className="page-width grid gap-10 py-12 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-7 text-muted-foreground">
            {t(
              "আপনার প্রতিটি এক্সচেঞ্জে স্বচ্ছতা, নিরাপত্তা ও মানুষের যত্ন।",
              "A little more clarity. A lot more confidence. Your everyday exchange partner.",
            )}
          </p>
          <span className="mt-5 inline-flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" />
            {t("অ্যাডমিন যাচাইকৃত লেনদেন", "Human-verified. Always.")}
          </span>
        </div>
        <div>
          <p className="mb-4 text-sm font-semibold">
            {t("প্ল্যাটফর্ম", "Platform")}
          </p>
          <div className="flex flex-col gap-3 text-sm text-muted-foreground">
            <Link href="/#exchange">
              {t("এক্সচেঞ্জ করুন", "Exchange currencies")}
            </Link>
            <Link href="/#reserves">{t("আমাদের রিজার্ভ", "Our reserves")}</Link>
            <Link href="/dashboard">{t("আপনার অর্ডার", "Your orders")}</Link>
          </div>
        </div>
        <div>
          <p className="mb-4 text-sm font-semibold">
            {t("আমরা পাশে আছি", "Here to help")}
          </p>
          <div className="flex flex-col gap-3 text-sm text-muted-foreground">
            <Link href="/#faq">{t("সাধারণ প্রশ্ন", "Help & FAQs")}</Link>
            {siteConfig.supportEmail && (
              <a
                href={`mailto:${siteConfig.supportEmail}`}
                className="flex items-center gap-1"
              >
                {t("যোগাযোগ", "Contact support")}
                <ArrowUpRight className="size-3" />
              </a>
            )}
            <Link href="/terms">{t("শর্তাবলি", "Terms of service")}</Link>
            <Link href="/privacy">{t("গোপনীয়তা", "Privacy policy")}</Link>
          </div>
        </div>
      </div>
      <div className="page-width flex flex-wrap items-center justify-between gap-3 border-t py-5 text-[11px] text-muted-foreground">
        <span>
          © 2026 {siteConfig.name}.{" "}
          {t("সর্বস্বত্ব সংরক্ষিত।", "All rights reserved.")}
        </span>
        <span className="flex items-center gap-1.5">
          {t(
            "বাংলাদেশের জন্য, যত্নের সাথে।",
            "Made for Bangladesh, with care.",
          )}
          <span className="size-1.5 rounded-full bg-primary" />
        </span>
      </div>
    </footer>
  );
}
