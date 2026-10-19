"use client";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Clock3,
  AlertTriangle,
  Copy,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "./providers";
import { useResource } from "@/hooks/use-resource";
import { ResourceState } from "./resource-state";
import { StatusBadge } from "./status-badge";
import { Button } from "./ui/button";
import { money } from "@/lib/utils";
import type { OrderView } from "@/lib/types";
export function OrderDetail({ id }: { id: string }) {
  const { t, locale } = useLocale();
  const {
    data: order,
    error,
    loading,
    refresh,
  } = useResource<OrderView>(`/api/orders/${id}`);
  if (!order)
    return <ResourceState loading={loading} error={error} retry={refresh} />;
  const current = ["PENDING", "PROCESSING", "COMPLETED"].indexOf(order.status);
  async function copy() {
    try {
      await navigator.clipboard.writeText(order!.number);
      toast.success(t("কপি হয়েছে", "Order number copied"));
    } catch {
      toast.error(t("ম্যানুয়ালি কপি করুন", "Please copy manually"));
    }
  }
  return (
    <>
      <Link
        href="/dashboard/orders"
        className="mb-7 inline-flex items-center gap-2 text-xs text-muted-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("সব অর্ডার", "All exchanges")}
      </Link>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow mb-2 text-primary">
            {t("এক্সচেঞ্জের অগ্রগতি", "YOUR EXCHANGE JOURNEY")}
          </p>
          <h1 className="flex items-center gap-3 font-sans text-2xl font-semibold">
            {order.number}
            <Button
              variant="ghost"
              size="icon"
              onClick={copy}
              aria-label={t("অর্ডার নম্বর কপি", "Copy order number")}
            >
              <Copy />
            </Button>
          </h1>
          <p className="mt-2 text-xs text-muted-foreground">
            {new Date(order.createdAt).toLocaleString(
              locale === "bn" ? "bn-BD" : "en-US",
              { timeZone: "Asia/Dhaka" },
            )}{" "}
            · Asia/Dhaka
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      {order.reviewRequired && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/8 p-5 text-xs leading-6 text-amber-800 dark:text-amber-300">
          <AlertTriangle className="mt-1 size-4 shrink-0" />
          {t(
            "মেয়াদ শেষে পেমেন্ট জমা হয়েছে। ম্যানুয়াল রিভিউ প্রয়োজন; পেআউট এখনও কনফার্ম নয়।",
            "Payment proof arrived after expiry. Manual review is required; payout is not yet confirmed.",
          )}
        </div>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border bg-card p-6 sm:p-8">
          <h2 className="mb-8 text-lg font-semibold">
            {t("প্রতিটি ধাপে স্বচ্ছতা", "Clarity at every step")}
          </h2>
          {order.status === "CANCELLED" ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
              <h3 className="text-sm font-semibold">
                {t("অর্ডার বাতিল হয়েছে", "Exchange cancelled")}
              </h3>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                {order.cancellationReason}
              </p>
              <p className="mt-4 text-xs">
                {t("রিফান্ড স্ট্যাটাস", "Refund status")}:{" "}
                <strong>
                  {order.refundStatus === "PENDING"
                    ? t("অপেক্ষমাণ", "Pending")
                    : order.refundStatus === "REFUNDED"
                      ? t("ফেরত দেওয়া হয়েছে", "Refunded")
                      : t("প্রয়োজন নেই", "Not required")}
                </strong>
              </p>
              {order.refundReference && (
                <p className="mt-3 break-all font-mono text-xs">
                  {order.refundReference}
                </p>
              )}
            </div>
          ) : (
            <ol>
              {[
                {
                  title: t("অর্ডার গ্রহণ করা হয়েছে", "Your exchange is in"),
                  text: t(
                    "পেমেন্ট প্রমাণ জমা হয়েছে। যাচাইয়ের অপেক্ষায়।",
                    "Payment proof received. Waiting for verification.",
                  ),
                },
                {
                  title: t(
                    "পেমেন্ট যাচাই ও প্রসেসিং",
                    "Verified and on its way",
                  ),
                  text: t(
                    "অ্যাডমিন টাকা পাওয়া নিশ্চিত করে পেআউট প্রসেস করছেন।",
                    "An administrator confirms receipt and prepares your payout.",
                  ),
                },
                {
                  title: t(
                    "এক্সচেঞ্জ সম্পন্ন",
                    "All done. Possibilities unlocked.",
                  ),
                  text: t(
                    "পেআউট পাঠানো হয়েছে। নিচের রেফারেন্স দেখুন।",
                    "Your payout has been sent. Find the reference below.",
                  ),
                },
              ].map(({ title, text }, i) => (
                <li key={i} className="relative flex gap-4 pb-9 last:pb-0">
                  {i < 2 && (
                    <span className="absolute bottom-0 left-4 top-8 w-px bg-border" />
                  )}
                  <span
                    className={`relative flex size-8 shrink-0 items-center justify-center rounded-full border ${i <= current ? "border-primary/20 bg-accent text-primary" : "bg-background text-muted-foreground"}`}
                  >
                    {i <= current ? (
                      <Check className="size-4" />
                    ) : (
                      <Clock3 className="size-3.5" />
                    )}
                  </span>
                  <div>
                    <h3 className="pt-1 text-sm font-semibold">{title}</h3>
                    <p className="mt-2 text-xs leading-6 text-muted-foreground">
                      {text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
          {order.payoutReference && (
            <div className="mt-8 rounded-xl bg-accent p-5">
              <p className="text-xs font-medium text-primary">
                {t("পেআউট রেফারেন্স", "Payout reference")}
              </p>
              <p className="mt-2 break-all font-mono text-sm">
                {order.payoutReference}
              </p>
            </div>
          )}
        </section>
        <aside className="rounded-2xl border bg-card p-6">
          <h2 className="mb-5 text-base font-semibold">
            {t("এক্সচেঞ্জ বিস্তারিত", "The details")}
          </h2>
          <p className="mb-6 flex items-center gap-2 text-sm font-medium">
            {order.fromName}
            <ArrowRight className="size-3" />
            {order.toName}
          </p>
          <dl className="space-y-4 text-xs">
            {[
              [
                t("পাঠানো হয়েছে", "You sent"),
                `${money(order.sendAmount)} ${order.fromCurrency}`,
              ],
              [
                t("সার্ভিস ফি", "Platform fee"),
                `${money(order.fee)} ${order.fromCurrency}`,
              ],
              [
                t("আপনি পাবেন", "You receive"),
                `${money(order.receiveAmount, order.toCurrency)} ${order.toCurrency}`,
              ],
              [t("প্রাপক", "Destination"), order.destination],
              [t("প্রেরক", "Sending account"), order.senderAccount],
              ["TrxID", order.paymentTrxId],
            ].map(([key, value]) => (
              <div key={key} className="border-b pb-4 last:border-0 last:pb-0">
                <dt className="mb-1.5 text-muted-foreground">{key}</dt>
                <dd className="break-all font-sans font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
      {error && (
        <p className="mt-4 text-xs text-amber-600">
          {t(
            "আপডেট ব্যর্থ হয়েছে। শেষ প্রাপ্ত তথ্য দেখাচ্ছে।",
            "Refresh failed. Showing the last update.",
          )}
        </p>
      )}
    </>
  );
}
