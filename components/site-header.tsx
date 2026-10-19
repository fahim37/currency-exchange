"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ArrowLeftRight,
  Sun,
  Moon,
  Monitor,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { useLocale } from "./providers";
import { Button } from "./ui/button";
import { siteConfig } from "@/lib/config";
import { authClient } from "@/lib/auth-client";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 font-semibold tracking-tight text-xl"
      aria-label={`${siteConfig.name} home`}
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <ArrowLeftRight className="size-5" strokeWidth={2.5} />
      </span>
      <span>
        {siteConfig.name.endsWith("Hub") ? (
          <>
            {siteConfig.name.slice(0, -3)}
            <span className="text-primary">Hub</span>
          </>
        ) : (
          siteConfig.name
        )}
        <span className="ml-0.5 text-primary">.</span>
      </span>
    </Link>
  );
}
export function ThemeControls() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useLocale();
  return (
    <div className="flex items-center gap-1">
      <button
        className="rounded-lg px-2.5 py-2 text-xs font-semibold hover:bg-muted"
        onClick={() => setLocale(locale === "bn" ? "en" : "bn")}
        aria-label={t("Switch to English", "বাংলায় দেখুন")}
      >
        {locale === "bn" ? "EN" : "বাংলা"}
      </button>
      <div className="relative">
        <select
          aria-label={t("থিম", "Color theme")}
          value={theme || "system"}
          onChange={(e) => setTheme(e.target.value)}
          className="absolute inset-0 z-10 w-full cursor-pointer opacity-0"
        >
          <option value="system">{t("সিস্টেম", "System")}</option>
          <option value="light">{t("লাইট", "Light")}</option>
          <option value="dark">{t("ডার্ক", "Dark")}</option>
        </select>
        <span className="flex size-9 items-center justify-center rounded-lg hover:bg-muted">
          <Sun className="size-4 dark:hidden" />
          <Moon className="hidden size-4 dark:block" />
          <Monitor className="sr-only" />
        </span>
      </div>
    </div>
  );
}
export function SiteHeader() {
  const router = useRouter();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const links = [
    ["/#exchange", t("এক্সচেঞ্জ", "Exchange")],
    ["/#reserves", t("রিজার্ভ", "Our reserves")],
    ["/#how-it-works", t("যেভাবে কাজ করে", "How it works")],
    ["/#faq", t("সাধারণ প্রশ্ন", "FAQs")],
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:bg-card focus:p-3"
      >
        {t("মূল কনটেন্টে যান", "Skip to content")}
      </a>
      <div className="page-width flex h-20 items-center justify-between gap-5">
        <Logo />
        <nav
          className="hidden items-center gap-7 lg:flex"
          aria-label={t("প্রধান নেভিগেশন", "Main navigation")}
        >
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeControls />
          <div className="hidden h-5 w-px bg-border sm:block" />
          {session ? (
            <>
              <Button asChild size="sm">
                <Link href="/dashboard">
                  {t("ড্যাশবোর্ড", "Dashboard")}
                  <ArrowUpRight />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("লগ আউট", "Sign out")}
                onClick={async () => {
                  await authClient.signOut();
                  router.push("/");
                  router.refresh();
                }}
              >
                <LogOut />
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-sm font-medium sm:block"
              >
                {t("লগ ইন", "Log in")}
              </Link>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/signup">
                  {t("শুরু করুন", "Get started")}
                  <ArrowUpRight />
                </Link>
              </Button>
            </>
          )}
          <button
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={t("মেনু", "Menu")}
            className="rounded-lg p-2 lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="page-width flex flex-col gap-1 border-t py-4 lg:hidden">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="rounded-lg p-3 text-sm hover:bg-muted"
            >
              {label}
            </Link>
          ))}
          {!session && (
            <Link href="/login" className="p-3 text-sm text-primary">
              {t("লগ ইন / রেজিস্টার", "Log in / Sign up")}
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
