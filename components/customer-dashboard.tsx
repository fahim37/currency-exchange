"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeftRight,
  CheckCircle2,
  Clock3,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { motion } from "motion/react";
import { useLocale } from "./providers";
import { useResource } from "@/hooks/use-resource";
import type { OrderView } from "@/lib/types";
import { StatusBadge } from "./status-badge";
import { ResourceState } from "./resource-state";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { money } from "@/lib/utils";

interface OrdersData {
  orders: OrderView[];
  count: number;
  page: number;
  groups: { status: string; _count: number }[];
}
export function CustomerDashboard({ history = false }: { history?: boolean }) {
  const { t, locale } = useLocale();
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [page, setPage] = useState(1);
  const { data, error, loading, refresh } = useResource<OrdersData>(
    `/api/orders?page=${page}&search=${encodeURIComponent(search)}&status=${status}`,
  );
  const total = data?.groups.reduce((sum, g) => sum + g._count, 0) || 0,
    completed = data?.groups.find((g) => g.status === "COMPLETED")?._count || 0,
    pending =
      data?.groups
        .filter((g) => ["PENDING", "PROCESSING"].includes(g.status))
        .reduce((sum, g) => sum + g._count, 0) || 0;
  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2 text-primary">
            {t("আপনার এক্সচেঞ্জ, এক জায়গায়", "YOUR MONEY, IN MOTION")}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {history
              ? t("আমার এক্সচেঞ্জ", "My exchanges")
              : t("আপনার ওভারভিউ", "A clearer picture.")}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {t(
              "সব অর্ডার ও অগ্রগতি সহজেই দেখুন।",
              "A home for every exchange. Keep an eye on what’s next.",
            )}
          </p>
        </div>
        <Button asChild>
          <Link href="/#exchange">
            {t("নতুন এক্সচেঞ্জ", "New exchange")}
            <ArrowUpRight />
          </Link>
        </Button>
      </div>
      {!history && (
        <>
          <div className="mb-7 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: ArrowLeftRight,
                label: t("মোট এক্সচেঞ্জ", "Total exchanges"),
                value: total,
              },
              {
                icon: Clock3,
                label: t("চলমান এক্সচেঞ্জ", "In progress"),
                value: pending,
              },
              {
                icon: CheckCircle2,
                label: t("সম্পন্ন এক্সচেঞ্জ", "Completed exchanges"),
                value: completed,
              },
            ].map(({ icon: Icon, label, value }, i) => (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                key={label}
                className="rounded-2xl border bg-card p-6"
              >
                <span className="mb-5 flex size-10 items-center justify-center rounded-xl bg-accent text-primary">
                  <Icon className="size-5" />
                </span>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-2 font-sans text-3xl font-semibold">
                  {loading ? "—" : value}
                </p>
              </motion.div>
            ))}
          </div>
          <div className="mb-8 flex items-center gap-4 rounded-2xl border border-primary/15 bg-accent p-5">
            <ShieldCheck className="size-8 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold">
                {t(
                  "প্রতিটি পেমেন্ট যাচাই করা হয়।",
                  "Real people behind every exchange.",
                )}
              </p>
              <p className="mt-1 text-xs leading-6 text-muted-foreground">
                {t(
                  "আপনার পেমেন্ট অ্যাডমিন যাচাই করে পেআউট করবেন। অর্ডার খুলে বিস্তারিত দেখুন।",
                  "We verify your payment before payout. Open any order to see the details.",
                )}
              </p>
            </div>
          </div>
        </>
      )}
      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <h2 className="text-base font-semibold">
            {t("এক্সচেঞ্জ হিস্টরি", "Exchange history")}
          </h2>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 size-3.5 text-muted-foreground" />
              <Input
                aria-label={t("অর্ডার খুঁজুন", "Search order number")}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={t("অর্ডার নম্বর…", "Search order number…")}
                className="h-10 w-48 pl-9"
              />
            </div>
            <select
              aria-label={t("স্ট্যাটাস ফিল্টার", "Filter status")}
              className="select-field h-10! w-auto!"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{t("সব স্ট্যাটাস", "All statuses")}</option>
              {["PENDING", "PROCESSING", "COMPLETED", "CANCELLED"].map((s) => (
                <option key={s} value={s}>
                  {t(
                    {
                      PENDING: "অপেক্ষমাণ",
                      PROCESSING: "প্রসেসিং",
                      COMPLETED: "সম্পন্ন",
                      CANCELLED: "বাতিল",
                    }[s as "PENDING"],
                    s,
                  )}
                </option>
              ))}
            </select>
          </div>
        </div>
        {loading || (error && !data) ? (
          <ResourceState loading={loading} error={error} retry={refresh} />
        ) : !data?.orders.length ? (
          <ResourceState empty />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  {[
                    t("অর্ডার", "ORDER"),
                    t("এক্সচেঞ্জ", "EXCHANGE"),
                    t("পরিমাণ", "YOU RECEIVE"),
                    t("স্ট্যাটাস", "STATUS"),
                    t("তারিখ", "DATE"),
                    "",
                  ].map((s, i) => (
                    <th key={i}>{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="font-mono text-xs font-medium text-primary"
                      >
                        {order.number}
                      </Link>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-2 text-xs">
                        {order.fromName}
                        <ArrowRight className="size-3 text-muted-foreground" />
                        {order.toName}
                      </span>
                    </td>
                    <td className="font-sans font-semibold">
                      {money(order.receiveAmount, order.toCurrency)}{" "}
                      <span className="text-[10px] text-muted-foreground">
                        {order.toCurrency}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString(
                        locale === "bn" ? "bn-BD" : "en-US",
                      )}
                    </td>
                    <td>
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        aria-label={`${t("অর্ডার দেখুন", "View order")} ${order.number}`}
                      >
                        <ArrowUpRight className="size-4 text-muted-foreground" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} count={data?.count || 0} onChange={setPage} />
      </div>
      {error && data && (
        <p className="mt-3 flex items-center gap-2 text-xs text-amber-600">
          <AlertCircle className="size-3" />
          {t(
            "শেষ প্রাপ্ত তথ্য দেখানো হচ্ছে।",
            "Showing the last available update.",
          )}
        </p>
      )}
    </>
  );
}
export function Pagination({
  page,
  count,
  onChange,
  pageSize = 10,
}: {
  page: number;
  count: number;
  onChange: (p: number) => void;
  pageSize?: number;
}) {
  const { t } = useLocale();
  return (
    <div className="flex items-center justify-between gap-3 border-t px-5 py-4 text-xs text-muted-foreground">
      <span>
        {t("মোট", "Total")} {count} · {t("পৃষ্ঠা", "Page")} {page} /{" "}
        {Math.max(1, Math.ceil(count / pageSize))}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          disabled={page <= 1}
          aria-label={t("আগের পৃষ্ঠা", "Previous page")}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="icon"
          disabled={page * pageSize >= count}
          aria-label={t("পরের পৃষ্ঠা", "Next page")}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
