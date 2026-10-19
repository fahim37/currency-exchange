"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownUp,
  ArrowUpRight,
  ChevronDown,
  ShieldCheck,
  Clock3,
  Info,
  Check,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import Decimal from "decimal.js";
import { useLocale } from "./providers";
import { Button } from "./ui/button";
import { MethodIcon } from "./method-icon";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import type { PublicData, MethodView } from "@/lib/types";
import { calculateExchange } from "@/lib/exchange-math";
import { money } from "@/lib/utils";

export function ExchangeCalculator({ data }: { data: PublicData }) {
  const { t, locale } = useLocale(),
    router = useRouter();
  const [from, setFrom] = useState(
    data.methods.find((m) => m.currency === "BDT")?.id || "",
  );
  const [to, setTo] = useState(
    data.methods.find((m) => m.name === "Payoneer")?.id ||
      data.methods.find((m) => m.currency !== "BDT")?.id ||
      "",
  );
  const [amount, setAmount] = useState("12350"),
    [picking, setPicking] = useState<"from" | "to" | null>(null),
    [error, setError] = useState("");
  const fromMethod = data.methods.find((m) => m.id === from),
    toMethod = data.methods.find((m) => m.id === to);
  const pair = data.pairs.find(
    (p) => p.fromId === from && p.toId === to && p.enabled,
  );
  let receive = "0",
    fee = "0",
    valid = false;
  try {
    if (
      pair &&
      toMethod &&
      fromMethod &&
      new Decimal(amount).decimalPlaces() <= fromMethod.decimals
    ) {
      const result = calculateExchange(
        amount,
        pair.rate,
        pair.feePercent,
        toMethod.decimals,
      );
      receive = result.receive;
      fee = result.fee;
      valid =
        new Decimal(amount).gte(pair.min) &&
        new Decimal(amount).lte(pair.max) &&
        new Decimal(receive).lte(toMethod.reserve) &&
        new Decimal(receive).gt(0);
    }
  } catch {
    /* Invalid input is explained inline. */
  }
  const choose = (method: MethodView) => {
    if (picking === "from") {
      setFrom(method.id);
      const next = data.pairs.find((p) => p.fromId === method.id && p.enabled);
      if (
        next &&
        !data.pairs.some(
          (p) => p.fromId === method.id && p.toId === to && p.enabled,
        )
      )
        setTo(next.toId);
      setAmount(method.currency === "BDT" ? "12350" : "100");
    } else setTo(method.id);
    setPicking(null);
    setError("");
  };
  function start() {
    if (!valid) {
      setError(
        t(
          "পরিমাণ ও উপলব্ধ রিজার্ভ যাচাই করুন।",
          "Check the amount, limits, and available reserve.",
        ),
      );
      return;
    }
    router.push(
      `/exchange?from=${from}&to=${to}&amount=${encodeURIComponent(amount)}`,
    );
  }
  const methodButton = (
    method: MethodView | undefined,
    side: "from" | "to",
  ) => (
    <button
      type="button"
      aria-label={
        side === "from"
          ? t("প্রেরক মাধ্যম নির্বাচন", "Select send method")
          : t("প্রাপক মাধ্যম নির্বাচন", "Select receive method")
      }
      onClick={() => setPicking(side)}
      className="flex items-center gap-2.5 rounded-xl border bg-card p-2 pr-3 text-sm font-semibold shadow-xs"
    >
      <MethodIcon
        name={method?.name || "?"}
        color={method?.color}
        className="size-8 rounded-lg text-base"
      />
      <span>{method?.name || t("নির্বাচন", "Select")}</span>
      <ChevronDown className="ml-1 size-3.5 text-muted-foreground" />
    </button>
  );
  return (
    <div className="relative" id="exchange">
      <div className="absolute -inset-4 -z-10 rounded-[38px] bg-primary/4 sm:-inset-5" />
      <div className="overflow-hidden rounded-[24px] border border-border bg-card p-5 shadow-[0_16px_65px_-28px_rgba(15,80,51,0.25)] sm:p-7">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("এক্সচেঞ্জ করুন", "Let’s make an exchange")}
          </h2>
          <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-medium text-primary">
            {t("সহজ ও নিরাপদ", "Simple & secure")}
          </span>
        </div>
        <div className="relative">
          <div className="rounded-2xl border bg-background p-4">
            <div className="mb-3 flex items-center justify-between">
              <label
                htmlFor="send-amount"
                className="text-xs text-muted-foreground"
              >
                {t("আপনি পাঠাবেন", "You send")}
              </label>
              <span className="text-[10px] font-medium text-muted-foreground">
                {fromMethod?.currency || "BDT"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <input
                id="send-amount"
                inputMode="decimal"
                autoComplete="off"
                value={amount}
                onChange={(e) => {
                  if (/^\d*\.?\d*$/.test(e.target.value)) {
                    setAmount(e.target.value);
                    setError("");
                  }
                }}
                className="min-w-0 w-full bg-transparent font-sans text-[29px] font-semibold tracking-tight outline-none"
                aria-describedby="exchange-limit"
              />
              {methodButton(fromMethod, "from")}
            </div>
          </div>
          <div className="relative z-10 -my-3 flex justify-center">
            <button
              onClick={() => {
                const reverse = data.pairs.find(
                  (p) => p.fromId === to && p.toId === from && p.enabled,
                );
                if (reverse) {
                  setFrom(to);
                  setTo(from);
                  setAmount(receive);
                  setError("");
                }
              }}
              aria-label={t("কারেন্সি বদল করুন", "Swap currencies")}
              className="flex size-9 items-center justify-center rounded-full border-4 border-card bg-primary text-primary-foreground shadow-sm transition-transform hover:rotate-180"
            >
              <ArrowDownUp className="size-4" />
            </button>
          </div>
          <div className="rounded-2xl border bg-background p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {t("আপনি পাবেন", "You receive")}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground">
                {toMethod?.currency || "USD"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <motion.output
                key={`${receive}-${to}`}
                initial={{ opacity: 0.5, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                className="min-w-0 truncate font-sans text-[29px] font-semibold tracking-tight text-primary"
                aria-live="polite"
              >
                {money(receive, toMethod?.currency)}
              </motion.output>
              {methodButton(toMethod, "to")}
            </div>
          </div>
        </div>
        <div className="my-5 space-y-3 px-0.5 text-xs">
          <div className="flex justify-between gap-2">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              {t("এক্সচেঞ্জ রেট", "Exchange rate")}
              <Info className="size-3" />
            </span>
            <span className="font-sans font-semibold">
              {pair && Number(pair.rate) < 1
                ? `1 ${toMethod?.currency} = ${money(new Decimal(1).div(pair.rate).toFixed(2))} ${fromMethod?.currency}`
                : `1 ${fromMethod?.currency || "USD"} = ${pair ? money(pair.rate) : "—"} ${toMethod?.currency || "BDT"}`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {t("সার্ভিস ফি", "Service fee")}
            </span>
            <span className="font-medium text-primary">
              {!pair
                ? "—"
                : Number(fee) === 0
                  ? t("ফ্রি", "No extra fees")
                  : `${money(fee)} ${fromMethod?.currency}`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {t("আনুমানিক সময়", "Estimated time")}
            </span>
            <span>
              {t("ম্যানুয়াল যাচাই সাপেক্ষে", "After manual verification")}
            </span>
          </div>
        </div>
        <Button
          size="lg"
          onClick={start}
          disabled={!pair}
          className="w-full justify-between px-5"
        >
          {t("এক্সচেঞ্জ শুরু করুন", "Start your exchange")}
          <ArrowUpRight className="size-5!" />
        </Button>
        <p
          id="exchange-limit"
          className="mt-3 text-center text-[10px] text-muted-foreground"
        >
          {pair
            ? `${t("সীমা", "Limit")}: ${money(pair.min, "BDT", locale)} – ${money(pair.max, "BDT", locale)} ${fromMethod?.currency}`
            : t(
                "এই পেয়ারটি বর্তমানে উপলব্ধ নেই",
                "This pair is currently unavailable",
              )}
        </p>
        {error && (
          <p role="alert" className="field-error text-center">
            {error}
          </p>
        )}
        <div className="mt-5 flex items-center justify-center gap-4 border-t pt-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-primary" />
            {t("অ্যাডমিন যাচাইকৃত", "Human verified")}
          </span>
          <span className="h-3 w-px bg-border" />
          <span className="flex items-center gap-1.5">
            <Clock3 className="size-3.5 text-primary" />
            {t("১৫ মিনিট রেট লক", "15-minute rate lock")}
          </span>
        </div>
      </div>
      <Dialog
        open={picking !== null}
        onOpenChange={(value) => {
          if (!value) setPicking(null);
        }}
      >
        <DialogContent>
          <DialogTitle className="text-xl font-semibold">
            {t("মাধ্যম নির্বাচন করুন", "Choose a payment method")}
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-muted-foreground">
            {t(
              "আপনার জন্য সুবিধাজনক মাধ্যম বেছে নিন।",
              "Choose the method that works for you.",
            )}
          </DialogDescription>
          <div className="mt-5 space-y-2">
            {data.methods
              .filter(
                (m) =>
                  m.enabled &&
                  (picking === "from" ||
                    data.pairs.some(
                      (p) => p.fromId === from && p.toId === m.id && p.enabled,
                    )),
              )
              .map((m) => (
                <button
                  key={m.id}
                  onClick={() => choose(m)}
                  className="flex w-full items-center gap-3 rounded-xl border p-3 text-left hover:border-primary hover:bg-accent"
                >
                  <MethodIcon name={m.name} color={m.color} />
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">
                      {m.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {m.currency}
                      {m.network ? ` · ${m.network}` : ""}
                    </span>
                  </span>
                  {(picking === "from" ? from : to) === m.id ? (
                    <Check className="size-4 text-primary" />
                  ) : (
                    <Wallet className="size-4 text-muted-foreground" />
                  )}
                </button>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
