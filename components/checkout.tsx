"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Copy,
  Clock3,
  ShieldCheck,
  LoaderCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { useLocale } from "./providers";
import { Button } from "./ui/button";
import { Input, Label } from "./ui/input";
import { MethodIcon } from "./method-icon";
import type { PublicData } from "@/lib/types";
import { authClient } from "@/lib/auth-client";
import { calculateExchange } from "@/lib/exchange-math";
import { money } from "@/lib/utils";
import { api, errorText } from "@/lib/client-api";
import { validDestination } from "@/lib/validation";

interface Quote {
  id: string;
  fromName: string;
  toName: string;
  fromCurrency: string;
  toCurrency: string;
  toNetwork: string | null;
  sendAmount: string;
  receiveAmount: string;
  rate: string;
  fee: string;
  destination: string;
  receivingAccount: string;
  instructions: string;
  instructionsEn: string;
  expiresAt: string;
  state: string;
  order?: { id: string } | null;
}
export function Checkout({ data }: { data: PublicData }) {
  const { t, locale } = useLocale(),
    params = useSearchParams(),
    router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const userId = session?.user.id;
  const from = data.methods.find((m) => m.id === params.get("from")),
    to = data.methods.find((m) => m.id === params.get("to"));
  const pair = data.pairs.find(
      (p) => p.fromId === from?.id && p.toId === to?.id,
    ),
    amount = params.get("amount") || "0";
  const [destination, setDestination] = useState(""),
    [quote, setQuote] = useState<Quote | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [step, setStep] = useState(1),
    [now, setNow] = useState(0),
    [saved, setSaved] = useState<
      { id: string; label: string; address: string; methodId: string }[]
    >([]);
  const [sender, setSender] = useState(""),
    [trxId, setTrxId] = useState("");
  const checkoutKey = `exchangehub-checkout:${params.toString()}`;
  useEffect(() => {
    const id = sessionStorage.getItem(checkoutKey);
    if (id && userId)
      api<Quote>(`/api/quotes/${id}`)
        .then((q) => {
          if (q.order) router.replace(`/dashboard/orders/${q.order.id}`);
          else {
            setNow(Date.now());
            setQuote(q);
            setStep(2);
          }
        })
        .catch(() => sessionStorage.removeItem(checkoutKey));
    if (userId)
      api<{ accounts: typeof saved }>("/api/profile")
        .then((d) => setSaved(d.accounts))
        .catch(() => {});
  }, [checkoutKey, userId, router]);
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  let result = { receive: "0", fee: "0", rate: "0", send: "0" };
  try {
    if (pair && to)
      result = calculateExchange(
        amount,
        pair.rate,
        pair.feePercent,
        to.decimals,
      );
  } catch {
    /* Invalid query is shown below. */
  }
  const seconds = quote
    ? Math.max(
        0,
        Math.floor(
          (new Date(quote.expiresAt).getTime() -
            (now || new Date(quote.expiresAt).getTime() - 900000)) /
            1000,
        ),
      )
    : 900;
  async function reserve(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!session) {
      router.push(
        `/login?next=${encodeURIComponent(`/exchange?${params.toString()}`)}`,
      );
      return;
    }
    if (!to || !validDestination(to.kind, destination, to.network)) {
      setError(
        t(
          "সঠিক প্রাপক অ্যাকাউন্ট ও নেটওয়ার্ক দিন।",
          "Enter a valid receiving account for the selected network.",
        ),
      );
      return;
    }
    setBusy(true);
    try {
      const key =
        sessionStorage.getItem(`${checkoutKey}:request`) || crypto.randomUUID();
      sessionStorage.setItem(`${checkoutKey}:request`, key);
      const q = await api<Quote>("/api/quotes", "POST", {
        fromId: from?.id,
        toId: to.id,
        amount,
        destination,
        requestKey: key,
      });
      sessionStorage.setItem(checkoutKey, q.id);
      setNow(Date.now());
      setQuote(q);
      setStep(2);
    } catch (e) {
      setError(errorText(e, locale));
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (step === 2) {
      setStep(3);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const order = await api<{ id: string }>("/api/orders", "POST", {
        quoteId: quote?.id,
        senderAccount: sender,
        trxId,
      });
      sessionStorage.removeItem(checkoutKey);
      sessionStorage.removeItem(`${checkoutKey}:request`);
      toast.success(
        t("অর্ডার জমা হয়েছে!", "Your exchange has been submitted!"),
      );
      router.push(`/dashboard/orders/${order.id}`);
    } catch (e) {
      setError(errorText(e, locale));
    } finally {
      setBusy(false);
    }
  }
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t("কপি হয়েছে", "Copied to clipboard"));
    } catch {
      toast.error(
        t("ম্যানুয়ালি কপি করুন", "Please copy the account manually"),
      );
    }
  }
  return (
    <>
      <SiteHeader />
      <main id="main" className="page-width min-h-[75vh] py-10">
        <Link
          href="/#exchange"
          className="mb-8 inline-flex items-center gap-2 text-xs text-muted-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("ক্যালকুলেটরে ফিরুন", "Back to calculator")}
        </Link>
        <p className="eyebrow mb-3 text-primary">
          {t("প্রতিটি ধাপে আপনার পাশে", "ONE STEP CLOSER")}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {t("আপনার এক্সচেঞ্জ সম্পন্ন করুন", "Let’s get your exchange moving.")}
        </h1>
        <div className="mb-9 mt-7 flex gap-3 sm:gap-7">
          {[
            t("প্রাপকের তথ্য", "Your details"),
            t("পেমেন্ট", "Payment"),
            t("রিভিউ", "Review & submit"),
          ].map((label, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 text-xs ${step >= i + 1 ? "text-primary" : "text-muted-foreground"}`}
            >
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full border font-sans text-[10px] ${step > i + 1 ? "border-primary bg-primary text-primary-foreground" : ""}`}
              >
                {step > i + 1 ? <Check className="size-3" /> : i + 1}
              </span>
              {label}
            </div>
          ))}
        </div>
        {!pair || !from || !to ? (
          <div className="rounded-2xl border p-10 text-center">
            <p>
              {t(
                "একটি সক্রিয় এক্সচেঞ্জ পেয়ার নির্বাচন করুন।",
                "Choose an available exchange pair to continue.",
              )}
            </p>
            <Button asChild className="mt-5">
              <Link href="/#exchange">
                {t("ক্যালকুলেটর", "Open calculator")}
                <ArrowUpRight />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid items-start gap-7 lg:grid-cols-[1.5fr_1fr]">
            <motion.section
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border bg-card p-6 sm:p-8"
            >
              {data.demo && (
                <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/8 p-4 text-xs leading-6 text-amber-800 dark:text-amber-300">
                  {t(
                    "এটি ডেভেলপমেন্ট প্রিভিউ। বাস্তব পেমেন্ট বা অর্ডার জমা দেওয়া বন্ধ।",
                    "This is a development preview. Real payments and order submission are disabled.",
                  )}
                </div>
              )}
              {step === 1 ? (
                <form onSubmit={reserve} className="space-y-5">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {t(
                        "কোথায় পেমেন্ট নিতে চান?",
                        "Where should your money go?",
                      )}
                    </h2>
                    <p className="mt-2 text-xs leading-6 text-muted-foreground">
                      {t(
                        "সঠিক অ্যাকাউন্ট দিন। কনফার্ম করার পর এই তথ্য পরিবর্তন হবে না।",
                        "Double-check your account. These details are locked after confirmation.",
                      )}
                    </p>
                  </div>
                  {saved.filter((a) => a.methodId === to.id).length > 0 && (
                    <div>
                      <Label htmlFor="saved">
                        {t("সেভ করা অ্যাকাউন্ট", "Saved accounts")}
                      </Label>
                      <select
                        id="saved"
                        className="select-field"
                        onChange={(e) => setDestination(e.target.value)}
                      >
                        <option value="">
                          {t("নির্বাচন করুন", "Choose an account")}
                        </option>
                        {saved
                          .filter((a) => a.methodId === to.id)
                          .map((a) => (
                            <option value={a.address} key={a.id}>
                              {a.label} · {a.address}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="destination">
                      {to.name}{" "}
                      {to.kind === "EMAIL"
                        ? t("ইমেইল", "email address")
                        : to.kind === "PHONE"
                          ? t("নম্বর", "phone number")
                          : t("ওয়ালেট / অ্যাকাউন্ট", "wallet / account")}
                    </Label>
                    <Input
                      id="destination"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      required
                      type={to.kind === "EMAIL" ? "email" : "text"}
                      maxLength={200}
                      placeholder={
                        to.kind === "EMAIL"
                          ? "you@example.com"
                          : to.kind === "PHONE"
                            ? "01XXXXXXXXX"
                            : "T..."
                      }
                    />
                    {to.network && (
                      <p className="mt-2 text-xs font-semibold text-primary">
                        {t("শুধুমাত্র এই নেটওয়ার্ক", "Only this network")}:{" "}
                        {to.network}
                      </p>
                    )}
                  </div>
                  <label className="flex gap-2 text-xs leading-6 text-muted-foreground">
                    <input
                      required
                      type="checkbox"
                      className="mt-1.5 accent-primary"
                    />
                    {t(
                      "আমি নিশ্চিত করেছি প্রাপকের তথ্য সঠিক।",
                      "I confirm that the receiving details are correct.",
                    )}
                  </label>
                  {error && (
                    <p role="alert" className="field-error">
                      {error}
                    </p>
                  )}
                  <Button
                    type="submit"
                    className="w-full justify-between"
                    disabled={
                      busy ||
                      isPending ||
                      (Boolean(session) && (!data.acceptingOrders || data.demo))
                    }
                  >
                    {busy ? (
                      <LoaderCircle className="animate-spin" />
                    ) : session ? (
                      t("কনফার্ম ও রেট লক করুন", "Confirm & lock my rate")
                    ) : (
                      t("লগ ইন করে চালিয়ে যান", "Sign in to continue")
                    )}
                    <ArrowRight />
                  </Button>
                </form>
              ) : (
                quote && (
                  <form onSubmit={submit} className="space-y-5">
                    <div
                      className={`flex items-center justify-between rounded-xl p-4 text-xs ${seconds ? "bg-accent text-primary" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}
                    >
                      <span className="flex items-center gap-2">
                        <Clock3 className="size-4" />
                        {seconds
                          ? t("রেট লক বাকি", "Rate locked for")
                          : t("চেকআউটের মেয়াদ শেষ", "Checkout expired")}
                      </span>
                      <span className="font-mono font-semibold">
                        {String(Math.floor(seconds / 60)).padStart(2, "0")}:
                        {String(seconds % 60).padStart(2, "0")}
                      </span>
                    </div>
                    {!seconds && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          sessionStorage.removeItem(checkoutKey);
                          sessionStorage.removeItem(`${checkoutKey}:request`);
                          setDestination(quote.destination);
                          setQuote(null);
                          setStep(1);
                          setError("");
                        }}
                      >
                        {t(
                          "নতুন এক্সচেঞ্জ শুরু করুন",
                          "Start a fresh exchange",
                        )}
                      </Button>
                    )}
                    {!seconds && (
                      <p
                        role="alert"
                        className="text-xs leading-6 text-amber-700 dark:text-amber-300"
                      >
                        {t(
                          "নতুন পেমেন্ট করবেন না। ইতোমধ্যে পাঠিয়ে থাকলে প্রমাণ জমা দিন। ম্যানুয়াল রিভিউ হবে।",
                          "Do not send a new payment. If you already paid, submit your proof for manual review.",
                        )}
                      </p>
                    )}
                    <h2 className="text-xl font-semibold">
                      {step === 2
                        ? t("পেমেন্ট পাঠান ও তথ্য দিন", "Send your payment")
                        : t(
                            "জমা দেওয়ার আগে যাচাই করুন",
                            "One last look before you submit",
                          )}
                    </h2>
                    {step === 2 ? (
                      <>
                        <div className="rounded-xl border bg-background p-5">
                          <p className="text-xs text-muted-foreground">
                            {t("এই অ্যাকাউন্টে পাঠান", "Send to this account")}{" "}
                            · {quote.fromName}
                          </p>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <p className="break-all font-mono text-lg font-semibold">
                              {quote.receivingAccount}
                            </p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={t(
                                "অ্যাকাউন্ট কপি",
                                "Copy receiving account",
                              )}
                              onClick={() => copy(quote.receivingAccount)}
                            >
                              <Copy />
                            </Button>
                          </div>
                          <p className="mt-4 text-xl font-semibold text-primary">
                            {money(quote.sendAmount)} {quote.fromCurrency}
                          </p>
                          <p className="mt-3 whitespace-pre-wrap text-xs leading-6 text-muted-foreground">
                            {t(quote.instructions, quote.instructionsEn)}
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="sender">
                            {t(
                              "আপনার প্রেরক অ্যাকাউন্ট / নম্বর",
                              "Your sending account / number",
                            )}
                          </Label>
                          <Input
                            id="sender"
                            required
                            value={sender}
                            onChange={(e) => setSender(e.target.value)}
                            maxLength={150}
                          />
                        </div>
                        <div>
                          <Label htmlFor="trx">
                            {t(
                              "পেমেন্ট Transaction ID (TrxID)",
                              "Payment transaction ID (TrxID)",
                            )}
                          </Label>
                          <Input
                            id="trx"
                            required
                            minLength={5}
                            maxLength={128}
                            pattern="[A-Za-z0-9._:\-]+"
                            value={trxId}
                            onChange={(e) => setTrxId(e.target.value)}
                            autoComplete="off"
                          />
                        </div>
                        <label className="flex gap-2 text-xs leading-6 text-muted-foreground">
                          <input
                            required
                            type="checkbox"
                            className="mt-1.5 accent-primary"
                          />
                          {t(
                            "আমি পেমেন্ট পাঠিয়েছি। একই TrxID অন্য অর্ডারে ব্যবহার করিনি।",
                            "I have sent the payment and have not used this TrxID on another order.",
                          )}
                        </label>
                      </>
                    ) : (
                      <>
                        <dl className="space-y-4 text-sm">
                          {[
                            [t("প্রেরক", "Sending account"), sender],
                            ["TrxID", trxId],
                            [
                              t("প্রাপক", "Receiving account"),
                              quote.destination,
                            ],
                            [
                              t("নেটওয়ার্ক", "Network"),
                              quote.toNetwork || "—",
                            ],
                          ].map(([key, value]) => (
                            <div
                              key={key}
                              className="flex flex-wrap justify-between gap-2 border-b pb-3"
                            >
                              <dt className="text-muted-foreground">{key}</dt>
                              <dd className="max-w-full break-all font-mono text-xs">
                                {value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                        <p className="flex items-start gap-2 rounded-xl bg-accent p-4 text-xs leading-6">
                          <ShieldCheck className="mt-1 size-4 shrink-0 text-primary" />
                          {t(
                            "অ্যাডমিন পেমেন্ট যাচাই করার পর পেআউট সম্পন্ন করবেন। ড্যাশবোর্ড থেকে অগ্রগতি দেখুন।",
                            "An administrator will verify your payment before payout. Follow the progress in your dashboard.",
                          )}
                        </p>
                      </>
                    )}
                    {error && (
                      <p role="alert" className="field-error">
                        {error}
                      </p>
                    )}
                    <div className="flex gap-3">
                      {step === 3 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setStep(2)}
                        >
                          {t("পেছনে", "Back")}
                        </Button>
                      )}
                      <Button
                        className="flex-1 justify-between"
                        disabled={busy}
                      >
                        {busy ? (
                          <LoaderCircle className="animate-spin" />
                        ) : step === 2 ? (
                          t("রিভিউ করুন", "Review exchange")
                        ) : (
                          t("অর্ডার জমা দিন", "Submit exchange")
                        )}
                        <ArrowUpRight />
                      </Button>
                    </div>
                  </form>
                )
              )}
            </motion.section>
            <aside className="rounded-2xl border bg-card p-6">
              <p className="eyebrow mb-5 text-muted-foreground">
                {t("এক্সচেঞ্জ সারাংশ", "YOUR EXCHANGE AT A GLANCE")}
              </p>
              <div className="mb-6 flex items-center gap-3">
                <MethodIcon name={quote?.fromName || from.name} />
                <ArrowRight className="size-4 text-muted-foreground" />
                <MethodIcon name={quote?.toName || to.name} />
                <span className="ml-auto text-xs font-medium">
                  {quote?.fromName || from.name} → {quote?.toName || to.name}
                </span>
              </div>
              <dl className="space-y-4 text-xs">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    {t("আপনি পাঠাবেন", "You send")}
                  </dt>
                  <dd className="font-semibold">
                    {money(quote?.sendAmount || amount)}{" "}
                    {quote?.fromCurrency || from.currency}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    {t("ফি", "Platform fee")}
                  </dt>
                  <dd>
                    {money(quote?.fee || result.fee)}{" "}
                    {quote?.fromCurrency || from.currency}
                  </dd>
                </div>
                <div className="flex justify-between border-t pt-5">
                  <dt>{t("আপনি পাবেন", "You receive")}</dt>
                  <dd className="text-xl font-semibold text-primary">
                    {money(
                      quote?.receiveAmount || result.receive,
                      quote?.toCurrency || to.currency,
                    )}{" "}
                    <span className="text-xs">
                      {quote?.toCurrency || to.currency}
                    </span>
                  </dd>
                </div>
              </dl>
              <p className="mt-5 flex items-start gap-2 text-[11px] leading-6 text-muted-foreground">
                <AlertTriangle className="mt-1 size-3.5 shrink-0" />
                {t(
                  "রেট লক করার পর প্রদর্শিত তথ্য অনুসরণ করুন। কাউকে পাসওয়ার্ড বা OTP দেবেন না।",
                  "Use only the account shown after locking your rate. Never share your password or OTP.",
                )}
              </p>
            </aside>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
