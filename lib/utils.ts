import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function money(value: string | number, currency = "USD", locale = "en") {
  return new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: currency === "USDT" ? 6 : 2,
  }).format(Number(value));
}
export function maskIdentity(value: string) {
  if (value.includes("@")) {
    const [name, domain] = value.split("@");
    return `${name.slice(0, 2)}***@${domain}`;
  }
  return `${value.slice(0, 3)}****${value.slice(-3)}`;
}
