"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ListOrdered,
  Plus,
  Search,
  Pencil,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "./providers";
import { useResource } from "@/hooks/use-resource";
import { api, errorText } from "@/lib/client-api";
import { ResourceState } from "./resource-state";
import { StatusBadge } from "./status-badge";
import { Pagination } from "./customer-dashboard";
import { MethodIcon } from "./method-icon";
import { Button } from "./ui/button";
import { Input, Label } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import type { OrderView, MethodView, PairView } from "@/lib/types";
import { money } from "@/lib/utils";
interface AdminOrder extends OrderView {
  version: number;
  paymentVerified: boolean;
  processedBy: string | null;
  quote: { receivingAccount: string; toNetwork: string | null };
  user: { name: string; email: string };
}
interface AdminMethod extends MethodView {
  slug: string;
  receivingAccount: string;
  instructions: string;
  instructionsEn: string;
  version: number;
}
interface Overview {
  groups: { status: string; _count: number }[];
  methods: AdminMethod[];
  recent: AdminOrder[];
  refunds: number;
}
interface OrdersResponse {
  orders: AdminOrder[];
  count: number;
  page: number;
}
interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  _count: { orders: number };
}
interface AuditRow {
  id: string;
  actorId: string;
  action: string;
  targetId: string;
  details: Record<string, unknown>;
  createdAt: string;
}
function AdminHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  const { t } = useLocale();
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow mb-2 text-primary">
          {t("অ্যাডমিন ওয়ার্কস্পেস", "EXCHANGEHUB BACKOFFICE")}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
export function AdminOverview() {
  const { t } = useLocale();
  const { data, error, loading, refresh } = useResource<Overview>(
    "/api/admin/overview",
  );
  const previous = useRef<number | null>(null);
  const pending = data?.groups.find((g) => g.status === "PENDING")?._count || 0;
  useEffect(() => {
    if (data) {
      if (previous.current !== null && pending > previous.current)
        toast.info(
          t("নতুন অর্ডার এসেছে", "New orders are waiting for verification"),
        );
      previous.current = pending;
    }
  }, [data, pending, t]);
  return (
    <>
      <AdminHeading
        title={t("আপনার কন্ট্রোল সেন্টার", "Your control center.")}
        subtitle={t(
          "অর্ডার, রিজার্ভ ও প্রতিদিনের কাজের সারাংশ।",
          "A clear view of your queue, reserves, and daily operations.",
        )}
      />
      {!data ? (
        <ResourceState loading={loading} error={error} retry={refresh} />
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                icon: ListOrdered,
                label: t("যাচাইয়ের অপেক্ষায়", "Awaiting verification"),
                value: pending,
              },
              {
                icon: Clock3,
                label: t("প্রসেসিং", "Processing"),
                value:
                  data.groups.find((g) => g.status === "PROCESSING")?._count ||
                  0,
              },
              {
                icon: CheckCircle2,
                label: t("সম্পন্ন", "Completed"),
                value:
                  data.groups.find((g) => g.status === "COMPLETED")?._count ||
                  0,
              },
              {
                icon: AlertTriangle,
                label: t("রিফান্ড বাকি", "Pending refunds"),
                value: data.refunds,
              },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-2xl border bg-card p-6">
                <Icon className="mb-5 size-5 text-primary" />
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-2 font-sans text-3xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <div className="mb-8 overflow-hidden rounded-2xl border bg-card">
            <div className="flex items-center justify-between p-5">
              <h2 className="text-base font-semibold">
                {t("পেমেন্ট যাচাইয়ের তালিকা", "Your verification queue")}
              </h2>
              <Link
                href="/admin/orders"
                className="flex items-center gap-1 text-xs text-primary"
              >
                {t("সব অর্ডার", "All orders")}
                <ArrowUpRight className="size-3" />
              </Link>
            </div>
            <AdminOrdersTable orders={data.recent} onUpdated={refresh} />
          </div>
          <h2 className="mb-4 text-lg font-semibold">
            {t("রিজার্ভের অবস্থা", "Reserves at a glance")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.methods.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-2xl border bg-card p-5"
              >
                <MethodIcon name={m.name} color={m.color} />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">{m.name}</p>
                  <p className="mt-1 font-sans text-lg font-semibold">
                    {money(m.reserve, m.currency)}{" "}
                    <span className="text-xs font-normal">{m.currency}</span>
                  </p>
                </div>
                <Link href="/admin/methods" aria-label={`Manage ${m.name}`}>
                  <Pencil className="size-3.5 text-muted-foreground" />
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
export function AdminOrders() {
  const { t } = useLocale();
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [refund, setRefund] = useState(false);
  const { data, loading, error, refresh } = useResource<OrdersResponse>(
    `/api/admin/orders?page=${page}&search=${encodeURIComponent(search)}&status=${status}&refund=${refund ? "PENDING" : ""}`,
  );
  return (
    <>
      <AdminHeading
        title={t("প্রতিটি অর্ডারে মনোযোগ", "Every exchange matters.")}
        subtitle={t(
          "পেমেন্ট যাচাই করুন, পেআউট দিন ও অগ্রগতি আপডেট করুন।",
          "Verify payments, complete payouts, and keep customers informed.",
        )}
      />
      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex flex-wrap items-center gap-3 p-5">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 size-3.5 text-muted-foreground" />
            <Input
              aria-label={t("অর্ডার খুঁজুন", "Search orders")}
              className="w-60 pl-9"
              placeholder={t("অর্ডার নম্বর বা TrxID", "Order number or TrxID")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            aria-label={t("স্ট্যাটাস", "Status filter")}
            className="select-field w-auto!"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t("সব স্ট্যাটাস", "All statuses")}</option>
            {["PENDING", "PROCESSING", "COMPLETED", "CANCELLED"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              className="accent-primary"
              checked={refund}
              onChange={(e) => {
                setRefund(e.target.checked);
                setPage(1);
              }}
            />
            {t("রিফান্ড বাকি", "Pending refunds")}
          </label>
        </div>
        {!data ? (
          <ResourceState loading={loading} error={error} retry={refresh} />
        ) : (
          <>
            <AdminOrdersTable orders={data.orders} onUpdated={refresh} />
            <Pagination page={page} count={data.count} onChange={setPage} />
          </>
        )}
      </div>
    </>
  );
}
function AdminOrdersTable({
  orders,
  onUpdated,
}: {
  orders: AdminOrder[];
  onUpdated: () => void;
}) {
  const { t, locale } = useLocale();
  const [selected, setSelected] = useState<AdminOrder | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function update(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const values = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await api(`/api/admin/orders/${selected.id}`, "PATCH", {
        status: String(values.get("status")),
        version: selected.version,
        reference: String(values.get("reference") || ""),
        reason: String(values.get("reason") || ""),
        paymentVerified: values.get("paymentVerified") === "on",
        ...(values.get("refundReference")
          ? {
              refundStatus: "REFUNDED",
              refundReference: String(values.get("refundReference")),
            }
          : {}),
      });
      toast.success(t("অর্ডার আপডেট হয়েছে", "Exchange updated"));
      setSelected(null);
      onUpdated();
    } catch (e) {
      setError(errorText(e, locale));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {!orders.length ? (
        <ResourceState empty />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {[
                  t("অর্ডার / কাস্টমার", "ORDER / CUSTOMER"),
                  t("এক্সচেঞ্জ", "EXCHANGE"),
                  t("প্রাপ্য", "PAYOUT"),
                  t("স্ট্যাটাস", "STATUS"),
                  t("কার্যক্রম", "ACTION"),
                ].map((s) => (
                  <th key={s}>{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <p className="font-mono text-xs font-semibold">
                      {o.number}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {o.user?.email}
                    </p>
                  </td>
                  <td>
                    <span className="flex items-center gap-2 text-xs">
                      {o.fromName}
                      <ArrowRight className="size-3" />
                      {o.toName}
                    </span>
                    {o.reviewRequired && (
                      <span className="mt-1 block text-[10px] text-amber-600">
                        {t(
                          "দেরিতে জমা · রিভিউ প্রয়োজন",
                          "Late proof · Review required",
                        )}
                      </span>
                    )}
                  </td>
                  <td className="font-sans font-semibold">
                    {money(o.receiveAmount, o.toCurrency)}{" "}
                    <span className="text-[10px]">{o.toCurrency}</span>
                  </td>
                  <td>
                    <StatusBadge status={o.status} />
                    {o.refundStatus === "PENDING" && (
                      <p className="mt-1 text-[10px] text-amber-600">
                        {t("রিফান্ড বাকি", "Refund pending")}
                      </p>
                    )}
                  </td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelected(o);
                        setError("");
                      }}
                    >
                      {t("বিস্তারিত", "Review")}
                      <ArrowUpRight />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(v) => {
          if (!v) setSelected(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogTitle className="font-mono text-lg font-semibold">
            {selected?.number}
          </DialogTitle>
          <DialogDescription className="mb-5 mt-2 text-xs text-muted-foreground">
            {t(
              "পেমেন্ট প্রোভাইডারের রেকর্ড মিলিয়ে পেমেন্ট যাচাই করুন।",
              "Verify payment against your provider’s records before processing.",
            )}
          </DialogDescription>
          {selected && (
            <>
              <StatusBadge status={selected.status} />
              <dl className="my-6 grid gap-4 rounded-xl bg-muted p-5 text-xs sm:grid-cols-2">
                {[
                  [t("কাস্টমার", "Customer"), selected.user?.email],
                  [
                    t("পাঠানো পরিমাণ", "Customer sent"),
                    `${selected.sendAmount} ${selected.fromCurrency}`,
                  ],
                  [
                    t("প্রেরক অ্যাকাউন্ট", "Sending account"),
                    selected.senderAccount,
                  ],
                  ["Payment TrxID", selected.paymentTrxId],
                  [
                    t(
                      "অ্যাডমিন রিসিভিং অ্যাকাউন্ট",
                      "Platform receiving account",
                    ),
                    selected.quote?.receivingAccount,
                  ],
                  [
                    t("পেআউট", "Payout amount"),
                    `${selected.receiveAmount} ${selected.toCurrency}`,
                  ],
                  [t("প্রাপক", "Destination"), selected.destination],
                  [
                    t("নেটওয়ার্ক", "Network"),
                    selected.quote?.toNetwork || "—",
                  ],
                  [
                    t("দায়িত্বপ্রাপ্ত অ্যাডমিন", "Assigned administrator"),
                    selected.processedBy || "—",
                  ],
                  [
                    t("পেআউট রেফারেন্স", "Payout reference"),
                    selected.payoutReference || "—",
                  ],
                  [
                    t("বাতিলের কারণ", "Cancellation reason"),
                    selected.cancellationReason || "—",
                  ],
                  [
                    t("রিফান্ড", "Refund status"),
                    `${selected.refundStatus}${selected.refundReference ? ` · ${selected.refundReference}` : ""}`,
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="mb-1.5 text-muted-foreground">{label}</dt>
                    <dd className="break-all font-mono leading-6">{value}</dd>
                  </div>
                ))}
              </dl>
              {selected.reviewRequired && (
                <p className="mb-5 rounded-xl bg-amber-500/10 p-4 text-xs leading-6 text-amber-700 dark:text-amber-300">
                  {t(
                    "মেয়াদ শেষে প্রমাণ এসেছে। প্রসেস করার সময় পুনরায় রিজার্ভ বরাদ্দ হবে। আগে টাকা পাওয়া নিশ্চিত করুন।",
                    "This proof arrived after expiry. Processing reacquires the required reserve. Confirm receipt first.",
                  )}
                </p>
              )}
              {selected.status !== "COMPLETED" &&
                !(
                  selected.status === "CANCELLED" &&
                  selected.refundStatus !== "PENDING"
                ) && (
                  <form onSubmit={update} className="space-y-4">
                    <div>
                      <Label htmlFor="process-status">
                        {t("পরবর্তী কাজ", "Next action")}
                      </Label>
                      <select
                        id="process-status"
                        name="status"
                        className="select-field"
                        defaultValue={
                          selected.status === "PENDING"
                            ? "PROCESSING"
                            : selected.status === "PROCESSING"
                              ? "COMPLETED"
                              : "CANCELLED"
                        }
                      >
                        {selected.status === "PENDING" && (
                          <option value="PROCESSING">
                            {t(
                              "পেমেন্ট যাচাইকৃত → প্রসেস করুন",
                              "Payment verified → Start processing",
                            )}
                          </option>
                        )}
                        {selected.status === "PROCESSING" && (
                          <option value="COMPLETED">
                            {t(
                              "পেআউট পাঠানো হয়েছে → সম্পন্ন",
                              "Payout sent → Complete exchange",
                            )}
                          </option>
                        )}
                        <option value="CANCELLED">
                          {selected.status === "CANCELLED"
                            ? t(
                                "রিফান্ড সম্পন্ন করুন",
                                "Record completed refund",
                              )
                            : t("অর্ডার বাতিল করুন", "Cancel exchange")}
                        </option>
                      </select>
                    </div>
                    {selected.status !== "CANCELLED" && (
                      <>
                        <label className="flex gap-2 text-xs leading-6">
                          <input
                            name="paymentVerified"
                            type="checkbox"
                            defaultChecked={selected.paymentVerified}
                            className="mt-1.5 accent-primary"
                          />
                          {t(
                            "প্রোভাইডারে টাকা পাওয়া নিশ্চিত করেছি",
                            "I confirmed that the customer’s payment was received",
                          )}
                        </label>
                        {selected.status === "PROCESSING" && (
                          <div>
                            <Label htmlFor="payout-ref">
                              {t(
                                "পেআউট রেফারেন্স (সম্পন্ন করতে আবশ্যক)",
                                "Payout reference (required to complete)",
                              )}
                            </Label>
                            <Input
                              id="payout-ref"
                              name="reference"
                              maxLength={200}
                            />
                          </div>
                        )}
                        <div>
                          <Label htmlFor="cancel-reason">
                            {t(
                              "বাতিলের কারণ (বাতিল করতে আবশ্যক)",
                              "Cancellation reason (required to cancel)",
                            )}
                          </Label>
                          <textarea
                            id="cancel-reason"
                            name="reason"
                            maxLength={1000}
                            className="select-field h-20! py-3"
                          />
                        </div>
                      </>
                    )}
                    {selected.status === "CANCELLED" && (
                      <div>
                        <Label htmlFor="refund-ref">
                          {t(
                            "রিফান্ড রেফারেন্স",
                            "Refund transaction reference",
                          )}
                        </Label>
                        <Input
                          id="refund-ref"
                          name="refundReference"
                          required
                          maxLength={200}
                        />
                        <p className="mt-2 text-xs text-muted-foreground">
                          {t(
                            "প্রেরকের অ্যাকাউন্টে টাকা ফেরত দেওয়ার পর জমা দিন।",
                            "Submit only after refunding the original sender.",
                          )}
                        </p>
                      </div>
                    )}
                    {error && (
                      <p role="alert" className="field-error">
                        {error}
                      </p>
                    )}
                    <Button disabled={busy} className="w-full">
                      {t("কনফার্ম ও আপডেট করুন", "Confirm & update order")}
                    </Button>
                  </form>
                )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
type FieldSpec = {
  key: string;
  bn: string;
  en: string;
  type?: string;
  required?: boolean;
};
const methodFields: FieldSpec[] = [
  { key: "name", bn: "নাম", en: "Display name", required: true },
  { key: "slug", bn: "স্লাগ", en: "Slug", required: true },
  { key: "currency", bn: "কারেন্সি", en: "Currency", type: "currency" },
  { key: "kind", bn: "অ্যাকাউন্ট ধরন", en: "Account type", type: "kind" },
  { key: "network", bn: "নেটওয়ার্ক", en: "Network (TRC20 for USDT)" },
  { key: "decimals", bn: "দশমিক ঘর", en: "Decimal places", type: "number" },
  { key: "color", bn: "ব্র্যান্ড রং", en: "Brand color", type: "color" },
  {
    key: "reserve",
    bn: "উপলব্ধ রিজার্ভ",
    en: "Available reserve",
    required: true,
  },
  {
    key: "receivingAccount",
    bn: "রিসিভিং অ্যাকাউন্ট",
    en: "Platform receiving account",
  },
  {
    key: "instructions",
    bn: "নির্দেশনা (বাংলা)",
    en: "Payment instructions (Bangla)",
    type: "textarea",
  },
  {
    key: "instructionsEn",
    bn: "নির্দেশনা (ইংরেজি)",
    en: "Payment instructions (English)",
    type: "textarea",
  },
];
const rateFields: FieldSpec[] = [
  { key: "fromId", bn: "প্রেরক মেথড", en: "Send method", type: "method" },
  { key: "toId", bn: "প্রাপক মেথড", en: "Receive method", type: "method" },
  {
    key: "rate",
    bn: "প্রতি ১ পাঠালে প্রাপ্য",
    en: "Receive units per 1 send unit",
    required: true,
  },
  { key: "feePercent", bn: "ফি (%)", en: "Fee (%)", required: true },
  {
    key: "min",
    bn: "সর্বনিম্ন পাঠানো",
    en: "Minimum send amount",
    required: true,
  },
  {
    key: "max",
    bn: "সর্বোচ্চ পাঠানো",
    en: "Maximum send amount",
    required: true,
  },
];
export function AdminConfiguration({
  resource,
}: {
  resource: "methods" | "rates";
}) {
  const { t, locale } = useLocale();
  const { data, error, loading, refresh } = useResource<
    AdminMethod[] | { pairs: PairView[]; methods: AdminMethod[] }
  >(`/api/admin/${resource}`);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null),
    [busy, setBusy] = useState(false),
    [formError, setError] = useState("");
  const methods = Array.isArray(data) ? data : data?.methods || [],
    rows =
      resource === "methods"
        ? methods
        : !Array.isArray(data)
          ? data?.pairs || []
          : [];
  function edit(row?: object) {
    setError("");
    setEditing(
      row
        ? { ...row }
        : resource === "methods"
          ? {
              name: "",
              slug: "",
              currency: "USD",
              kind: "EMAIL",
              network: "",
              decimals: 2,
              color: "#087f5b",
              reserve: "0",
              receivingAccount: "",
              instructions: "",
              instructionsEn: "",
              enabled: false,
            }
          : {
              fromId: "",
              toId: "",
              rate: "1",
              feePercent: "0",
              min: "10",
              max: "1000",
              enabled: false,
            },
    );
  }
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fields = Object.fromEntries(new FormData(e.currentTarget));
    const body = {
      ...editing,
      ...fields,
      enabled: fields.enabled === "on",
      ...(resource === "methods"
        ? { decimals: Number(fields.decimals), network: fields.network || null }
        : {}),
    };
    setBusy(true);
    setError("");
    try {
      await api(`/api/admin/${resource}`, "POST", body);
      setEditing(null);
      await refresh();
      toast.success(t("সেভ হয়েছে", "Configuration saved"));
    } catch (e) {
      setError(errorText(e, locale));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <AdminHeading
        title={
          resource === "methods"
            ? t("মেথড ও রিজার্ভ", "Methods & reserves")
            : t("আপনার রেট, আপনার নিয়ন্ত্রণ", "Your rates. Your control.")
        }
        subtitle={
          resource === "methods"
            ? t(
                "অ্যাকাউন্ট ও উপলব্ধ ব্যালেন্স আপডেট করুন।",
                "Manage receiving accounts and available balances.",
              )
            : t(
                "পেয়ার, রেট, ফি ও সীমা নির্ধারণ করুন।",
                "Set exchange pairs, rates, fees, and limits.",
              )
        }
        action={
          <Button onClick={() => edit()}>
            <Plus />
            {t("নতুন যোগ করুন", "Add new")}
          </Button>
        }
      />
      {!data ? (
        <ResourceState loading={loading} error={error} retry={refresh} />
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  {(resource === "methods"
                    ? [
                        t("মাধ্যম", "METHOD"),
                        t("কারেন্সি", "CURRENCY"),
                        t("রিজার্ভ", "AVAILABLE RESERVE"),
                        t("স্ট্যাটাস", "STATUS"),
                        "",
                      ]
                    : [
                        t("পেয়ার", "PAIR"),
                        t("রেট", "RATE"),
                        t("ফি", "FEE"),
                        t("সীমা", "LIMITS"),
                        t("স্ট্যাটাস", "STATUS"),
                        "",
                      ]
                  ).map((label, i) => (
                    <th key={i}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) =>
                  "reserve" in row ? (
                    <tr key={row.id}>
                      <td>
                        <span className="flex items-center gap-3">
                          <MethodIcon name={row.name} color={row.color} />
                          {row.name}
                        </span>
                      </td>
                      <td>
                        {row.currency}
                        {row.network ? ` · ${row.network}` : ""}
                      </td>
                      <td className="font-sans">
                        {money(row.reserve, row.currency)}
                      </td>
                      <td>
                        <Enabled value={row.enabled} />
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => edit(row)}
                        >
                          <Pencil />
                          {t("এডিট", "Edit")}
                        </Button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={row.id}>
                      <td>
                        {methods.find((m) => m.id === row.fromId)?.name} →{" "}
                        {methods.find((m) => m.id === row.toId)?.name}
                      </td>
                      <td className="font-mono text-xs">{row.rate}</td>
                      <td>{row.feePercent}%</td>
                      <td>
                        {row.min} – {row.max}
                      </td>
                      <td>
                        <Enabled value={row.enabled} />
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => edit(row)}
                        >
                          <Pencil />
                          {t("এডিট", "Edit")}
                        </Button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
          {!rows.length && <ResourceState empty />}
        </div>
      )}
      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogTitle className="text-xl font-semibold">
            {resource === "methods"
              ? t("পেমেন্ট মেথড", "Payment method")
              : t("এক্সচেঞ্জ পেয়ার", "Exchange pair")}
          </DialogTitle>
          <DialogDescription className="mb-6 mt-2 text-xs leading-6 text-muted-foreground">
            {resource === "methods"
              ? t(
                  "রিজার্ভ বর্তমানে উপলব্ধ ব্যালেন্স; চালু হোল্ড এর মধ্যে অন্তর্ভুক্ত নয়।",
                  "Reserve is currently available funds, excluding active holds. Processing adjusts balances automatically.",
                )
              : t(
                  "রেট হলো প্রতি ১ প্রেরক ইউনিটে প্রাপ্য। পুরোনো চেকআউটের রেট অপরিবর্তিত।",
                  "Rate is receive units per send unit. Existing checkouts retain their snapshots.",
                )}
          </DialogDescription>
          {editing && (
            <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
              {(resource === "methods" ? methodFields : rateFields).map((f) => (
                <div
                  key={f.key}
                  className={
                    f.type === "textarea" || f.key === "receivingAccount"
                      ? "sm:col-span-2"
                      : ""
                  }
                >
                  <Label htmlFor={`config-${f.key}`}>{t(f.bn, f.en)}</Label>
                  {["currency", "kind", "method"].includes(f.type || "") ? (
                    <select
                      className="select-field"
                      id={`config-${f.key}`}
                      name={f.key}
                      required
                      defaultValue={String(editing[f.key] ?? "")}
                    >
                      <option value="">{t("নির্বাচন করুন", "Select")}</option>
                      {f.type === "method"
                        ? methods.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} · {m.currency}
                            </option>
                          ))
                        : (f.type === "currency"
                            ? ["BDT", "USD", "USDT"]
                            : ["PHONE", "EMAIL", "WALLET", "BANK"]
                          ).map((v) => <option key={v}>{v}</option>)}
                    </select>
                  ) : f.type === "textarea" ? (
                    <textarea
                      className="select-field h-20! py-3"
                      id={`config-${f.key}`}
                      name={f.key}
                      defaultValue={String(editing[f.key] ?? "")}
                      maxLength={1000}
                    />
                  ) : (
                    <Input
                      id={`config-${f.key}`}
                      name={f.key}
                      type={f.type || "text"}
                      required={f.required}
                      defaultValue={String(editing[f.key] ?? "")}
                      min={f.type === "number" ? 0 : undefined}
                      max={f.type === "number" ? 6 : undefined}
                    />
                  )}
                </div>
              ))}
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  name="enabled"
                  defaultChecked={Boolean(editing.enabled)}
                  className="accent-primary"
                />
                {t("সক্রিয় করুন", "Enable for exchanges")}
              </label>
              {formError && (
                <p role="alert" className="field-error sm:col-span-2">
                  {formError}
                </p>
              )}
              <Button className="sm:col-span-2" disabled={busy}>
                {t("সেভ করুন", "Save configuration")}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
function Enabled({ value }: { value: boolean }) {
  const { t } = useLocale();
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] ${value ? "bg-accent text-primary" : "bg-muted text-muted-foreground"}`}
    >
      {value ? t("সক্রিয়", "Enabled") : t("বন্ধ", "Disabled")}
    </span>
  );
}
interface SettingsData {
  online: boolean;
  acceptingOrders: boolean;
  notice: string;
  noticeEn: string;
  serviceHours: string;
}
export function AdminSettings() {
  const { t, locale } = useLocale();
  const { data, loading, error, refresh } = useResource<SettingsData>(
    "/api/admin/settings",
  );
  const [busy, setBusy] = useState(false),
    [formError, setError] = useState("");
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    try {
      await api("/api/admin/settings", "POST", {
        ...values,
        online: values.online === "on",
        acceptingOrders: values.acceptingOrders === "on",
      });
      await refresh();
      toast.success(t("সেটিংস সেভ হয়েছে", "Service settings saved"));
      setError("");
    } catch (e) {
      setError(errorText(e, locale));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <AdminHeading
        title={t("সার্ভিস সেটিংস", "Keep everyone in the loop.")}
        subtitle={t(
          "সার্ভিস স্ট্যাটাস, নোটিশ ও সময়সূচি নিয়ন্ত্রণ করুন।",
          "Control service availability, notices, and business hours.",
        )}
      />
      {!data ? (
        <ResourceState loading={loading} error={error} retry={refresh} />
      ) : (
        <form
          onSubmit={save}
          className="max-w-2xl space-y-6 rounded-2xl border bg-card p-6 sm:p-8"
        >
          <div className="flex gap-3 rounded-xl bg-accent p-4 text-xs leading-6">
            <ShieldCheck className="mt-1 size-5 shrink-0 text-primary" />
            {t(
              "বাস্তব অ্যাকাউন্ট, রেট ও রিজার্ভ কনফিগার করার পর নতুন অর্ডার চালু করুন। পুরোনো পেমেন্ট প্রমাণ সার্ভিস বন্ধ থাকলেও জমা দেওয়া যাবে।",
              "Enable intake after configuring real accounts, rates, and reserves. Existing payment proofs can still be submitted while intake is closed.",
            )}
          </div>
          <label className="flex items-center justify-between gap-4 text-sm">
            <span>{t("অ্যাডমিন অনলাইন", "Administrator online")}</span>
            <input
              type="checkbox"
              name="online"
              defaultChecked={data.online}
              className="size-4 accent-primary"
            />
          </label>
          <label className="flex items-center justify-between gap-4 text-sm">
            <span>{t("নতুন অর্ডার গ্রহণ করুন", "Accept new exchanges")}</span>
            <input
              type="checkbox"
              name="acceptingOrders"
              defaultChecked={data.acceptingOrders}
              className="size-4 accent-primary"
            />
          </label>
          {[
            {
              key: "notice",
              bn: "নোটিশ (বাংলা)",
              en: "Public notice (Bangla)",
            },
            {
              key: "noticeEn",
              bn: "নোটিশ (ইংরেজি)",
              en: "Public notice (English)",
            },
            {
              key: "serviceHours",
              bn: "সার্ভিস আওয়ার",
              en: "Service hours (Asia/Dhaka)",
            },
          ].map((f) => (
            <div key={f.key}>
              <Label htmlFor={f.key}>{t(f.bn, f.en)}</Label>
              <Input
                id={f.key}
                name={f.key}
                defaultValue={data[f.key as keyof SettingsData] as string}
                maxLength={f.key === "serviceHours" ? 150 : 500}
              />
            </div>
          ))}
          {formError && (
            <p role="alert" className="field-error">
              {formError}
            </p>
          )}
          <Button disabled={busy}>
            {t("সেটিংস সেভ করুন", "Save service settings")}
          </Button>
        </form>
      )}
    </>
  );
}
export function AdminDirectory({ audit = false }: { audit?: boolean }) {
  const { t, locale } = useLocale();
  const [page, setPage] = useState(1),
    [search, setSearch] = useState("");
  const { data, error, loading, refresh } = useResource<{
    users?: UserRow[];
    events?: AuditRow[];
    count: number;
  }>(
    `/api/admin/${audit ? "audit" : "users"}?page=${page}&search=${encodeURIComponent(search)}`,
  );
  const [user, setUser] = useState<UserRow | null>(null);
  const { data: userOrders } = useResource<OrdersResponse>(
    `/api/admin/orders?user=${user?.id || "000000000000000000000000"}`,
  );
  return (
    <>
      <AdminHeading
        title={
          audit
            ? t("প্রতিটি পরিবর্তনের রেকর্ড", "A record of every change.")
            : t("আমাদের কাস্টমার", "The people behind the exchanges.")
        }
        subtitle={
          audit
            ? t(
                "অ্যাডমিনের কাজের অপরিবর্তনীয় ইতিহাস।",
                "An append-only history of administrator actions.",
              )
            : t(
                "কাস্টমার প্রোফাইল ও অর্ডার দেখুন।",
                "Customer profiles and their exchange history.",
              )
        }
      />
      {!audit && (
        <Input
          className="mb-5 max-w-sm"
          placeholder={t("নাম বা ইমেইল দিয়ে খুঁজুন", "Search name or email")}
          aria-label={t("কাস্টমার খুঁজুন", "Search customers")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      )}
      {!data ? (
        <ResourceState loading={loading} error={error} retry={refresh} />
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  {(audit
                    ? [
                        t("সময়", "TIME"),
                        t("কার্যক্রম", "ACTION"),
                        t("অ্যাডমিন", "ACTOR"),
                        t("রেকর্ড", "TARGET"),
                        t("বিস্তারিত", "DETAILS"),
                      ]
                    : [
                        t("কাস্টমার", "CUSTOMER"),
                        t("রোল", "ROLE"),
                        t("ইমেইল যাচাই", "EMAIL VERIFIED"),
                        t("অর্ডার", "ORDERS"),
                        "",
                      ]
                  ).map((s, i) => (
                    <th key={i}>{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {audit
                  ? data.events?.map((e) => (
                      <tr key={e.id}>
                        <td className="text-xs">
                          {new Date(e.createdAt).toLocaleString(
                            locale === "bn" ? "bn-BD" : "en-US",
                            { timeZone: "Asia/Dhaka" },
                          )}
                        </td>
                        <td className="font-mono text-xs text-primary">
                          {e.action}
                        </td>
                        <td className="font-mono text-[10px]">{e.actorId}</td>
                        <td className="font-mono text-[10px]">{e.targetId}</td>
                        <td>
                          <details>
                            <summary className="text-xs text-primary">
                              {t("দেখুন", "Inspect")}
                            </summary>
                            <pre className="mt-3 max-w-xs whitespace-pre-wrap break-all text-[10px]">
                              {JSON.stringify(e.details, null, 2)}
                            </pre>
                          </details>
                        </td>
                      </tr>
                    ))
                  : data.users?.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <p className="text-sm font-medium">{u.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {u.email}
                          </p>
                        </td>
                        <td className="text-xs">{u.role}</td>
                        <td>
                          <Enabled value={u.emailVerified} />
                        </td>
                        <td>{u._count.orders}</td>
                        <td>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUser(u)}
                          >
                            {t("প্রোফাইল", "View profile")}
                            <ArrowUpRight />
                          </Button>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          {!(audit ? data.events?.length : data.users?.length) && (
            <ResourceState empty />
          )}
          <Pagination
            page={page}
            count={data.count}
            onChange={setPage}
            pageSize={audit ? 20 : 10}
          />
        </div>
      )}
      <Dialog
        open={Boolean(user)}
        onOpenChange={(v) => {
          if (!v) setUser(null);
        }}
      >
        <DialogContent>
          <DialogTitle className="text-lg font-semibold">
            {user?.name}
          </DialogTitle>
          <DialogDescription className="mt-2 text-xs">
            {user?.email} · {user?.role}
          </DialogDescription>
          <p className="mb-4 mt-6 text-sm font-semibold">
            {t("সাম্প্রতিক অর্ডার", "Recent exchanges")}
          </p>
          {userOrders?.orders.map((o) => (
            <div
              key={o.id}
              className="flex flex-wrap items-center justify-between gap-2 border-t py-4 text-xs"
            >
              <span className="font-mono">{o.number}</span>
              <span>
                {o.fromName} → {o.toName}
              </span>
              <StatusBadge status={o.status} />
            </div>
          ))}
          {!userOrders?.orders.length && <ResourceState empty />}
        </DialogContent>
      </Dialog>
    </>
  );
}
