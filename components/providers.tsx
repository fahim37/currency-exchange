"use client";
import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { ThemeProvider } from "next-themes";
import { MotionConfig } from "motion/react";
import { Toaster } from "sonner";
import type { Locale } from "@/lib/types";
const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (bn: string, en: string) => string;
}>({ locale: "bn", setLocale: () => {}, t: (bn) => bn });
export function useLocale() {
  return useContext(LocaleContext);
}
export function Providers({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    subscribe,
    getLocale,
    () => "bn" as Locale,
  );
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  function setLocale(value: Locale) {
    localStorage.setItem("exchangehub-locale", value);
    window.dispatchEvent(new Event("exchangehub-locale"));
  }
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <LocaleContext.Provider
        value={{
          locale,
          setLocale,
          t: (bn, en) => (locale === "bn" ? bn : en),
        }}
      >
        <MotionConfig reducedMotion="user">
          {children}
          <Toaster richColors position="bottom-right" />
        </MotionConfig>
      </LocaleContext.Provider>
    </ThemeProvider>
  );
}
function subscribe(callback: () => void) {
  window.addEventListener("exchangehub-locale", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("exchangehub-locale", callback);
    window.removeEventListener("storage", callback);
  };
}
function getLocale(): Locale {
  return localStorage.getItem("exchangehub-locale") === "en" ? "en" : "bn";
}
