"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  LayoutDashboard,
  ListOrdered,
  UserRound,
  Wallet,
  SlidersHorizontal,
  Users,
  Settings2,
  ScrollText,
  LogOut,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { Logo, ThemeControls } from "./site-header";
import { useLocale } from "./providers";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
export function WorkspaceShell({
  children,
  user,
  admin = false,
}: {
  children: React.ReactNode;
  user: { name: string; email: string; role: string };
  admin?: boolean;
}) {
  const { t } = useLocale(),
    pathname = usePathname(),
    router = useRouter();
  const links = admin
    ? [
        {
          href: "/admin",
          icon: LayoutDashboard,
          label: t("ওভারভিউ", "Overview"),
        },
        {
          href: "/admin/orders",
          icon: ListOrdered,
          label: t("অর্ডার", "Orders"),
        },
        {
          href: "/admin/rates",
          icon: SlidersHorizontal,
          label: t("এক্সচেঞ্জ রেট", "Exchange rates"),
        },
        {
          href: "/admin/methods",
          icon: Wallet,
          label: t("মেথড ও রিজার্ভ", "Methods & reserves"),
        },
        {
          href: "/admin/users",
          icon: Users,
          label: t("ব্যবহারকারী", "Customers"),
        },
        {
          href: "/admin/settings",
          icon: Settings2,
          label: t("সেটিংস", "Service settings"),
        },
        {
          href: "/admin/audit",
          icon: ScrollText,
          label: t("অডিট লগ", "Audit log"),
        },
      ]
    : [
        {
          href: "/dashboard",
          icon: LayoutDashboard,
          label: t("ওভারভিউ", "Overview"),
        },
        {
          href: "/dashboard/orders",
          icon: ListOrdered,
          label: t("আমার এক্সচেঞ্জ", "My exchanges"),
        },
        {
          href: "/dashboard/profile",
          icon: UserRound,
          label: t("প্রোফাইল ও অ্যাকাউন্ট", "Profile & accounts"),
        },
      ];
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b bg-card lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between p-5 lg:px-6 lg:py-8">
          <Logo />
          <span className="rounded-md bg-accent px-2 py-1 text-[9px] font-semibold text-primary lg:hidden">
            {admin ? "ADMIN" : "ACCOUNT"}
          </span>
        </div>
        <div className="hidden px-6 pb-4 text-[10px] tracking-widest text-muted-foreground lg:block">
          {admin
            ? t("অ্যাডমিন ওয়ার্কস্পেস", "ADMIN WORKSPACE")
            : t("আপনার ওয়ার্কস্পেস", "YOUR WORKSPACE")}
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4 pb-3 lg:flex-col lg:px-3">
          {links.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-xs font-medium transition-colors",
                pathname === href ||
                  (href === "/dashboard/orders" &&
                    pathname.startsWith("/dashboard/orders/"))
                  ? "bg-accent text-primary"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
          {user.role === "ADMIN" && (
            <Link
              href={admin ? "/dashboard" : "/admin"}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-xs text-primary"
            >
              <ShieldCheck className="size-4" />
              {admin
                ? t("কাস্টমার ভিউ", "Customer view")
                : t("অ্যাডমিন প্যানেল", "Admin panel")}
            </Link>
          )}
        </nav>
        <div className="mt-auto hidden p-4 lg:block">
          <div className="rounded-2xl bg-accent p-4">
            <ArrowLeftRight className="mb-3 size-5 text-primary" />
            <p className="text-xs font-medium">
              {t(
                "পরবর্তী এক্সচেঞ্জের জন্য প্রস্তুত?",
                "Ready for your next move?",
              )}
            </p>
            <Link
              href="/#exchange"
              className="mt-3 flex items-center gap-1 text-xs text-primary"
            >
              {t("এক্সচেঞ্জ করুন", "Make an exchange")}
              <ArrowUpRight className="size-3" />
            </Link>
          </div>
          <button
            onClick={async () => {
              await authClient.signOut();
              router.push("/");
              router.refresh();
            }}
            className="mt-4 flex w-full items-center gap-3 rounded-xl p-3 text-xs text-muted-foreground hover:bg-muted"
          >
            <LogOut className="size-4" />
            {t("লগ আউট", "Sign out")}
          </button>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="flex h-20 items-center justify-between gap-3 border-b bg-card/60 px-5 sm:px-8">
          <p className="text-xs text-muted-foreground">
            {t("স্বাগতম", "Welcome back")},{" "}
            <span className="font-medium text-foreground">{user.name}</span>
          </p>
          <div className="flex items-center gap-3">
            <ThemeControls />
            <span className="hidden h-5 w-px bg-border sm:block" />
            <span className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-primary">
              {user.name.slice(0, 2).toUpperCase()}
            </span>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
            >
              <Link href="/#exchange">
                {t("নতুন এক্সচেঞ্জ", "New exchange")}
                <ArrowUpRight />
              </Link>
            </Button>
          </div>
        </header>
        <main id="main" className="mx-auto max-w-[1300px] p-5 sm:p-8 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
