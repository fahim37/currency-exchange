"use client";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ShieldCheck,
  LockKeyhole,
  Headphones,
  ArrowLeftRight,
  Wallet,
  Send,
  CircleCheck,
  ChevronDown,
  CircleHelp,
  Globe2,
  Radio,
  Layers3,
} from "lucide-react";
import { motion } from "motion/react";
import type { HTMLMotionProps } from "motion/react";
import { Children, type ReactNode } from "react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { ExchangeCalculator } from "./exchange-calculator";
import { MethodIcon } from "./method-icon";
import { StatusBadge } from "./status-badge";
import { useLocale } from "./providers";
import { Button } from "./ui/button";
import { usePoll } from "@/hooks/use-poll";
import { money } from "@/lib/utils";
import type { PublicData } from "@/lib/types";
const fade = {
  initial: { opacity: 1, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.5 },
};
// Normalize child keys before Motion forwards them through React.createElement.
function Reveal({
  children,
  ...props
}: Omit<HTMLMotionProps<"div">, "children"> & { children?: ReactNode }) {
  return <motion.div {...props}>{Children.toArray(children)}</motion.div>;
}
export function Home({ initialData }: { initialData: PublicData }) {
  const { data, error } = usePoll("/api/public", initialData);
  const { t, locale } = useLocale();
  const faqs = [
    [
      t("কীভাবে এক্সচেঞ্জ শুরু করব?", "How do I make my first exchange?"),
      t(
        "মাধ্যম ও পরিমাণ নির্বাচন করুন। লগ ইন করে প্রাপকের তথ্য দিন, প্রদর্শিত অ্যাকাউন্টে পেমেন্ট করুন এবং TrxID জমা দিন। অ্যাডমিন যাচাই করে পেআউট করবেন।",
        "Choose your currencies and amount, sign in, and enter your receiving details. Pay the account shown, then submit your transaction ID. An administrator verifies the payment and sends your payout.",
      ),
    ],
    [
      t(
        "এক্সচেঞ্জ সম্পন্ন হতে কত সময় লাগে?",
        "How long does an exchange take?",
      ),
      t(
        "সময় পেমেন্ট যাচাই, মাধ্যম ও সার্ভিস আওয়ারের ওপর নির্ভর করে। ড্যাশবোর্ডে প্রতিটি ধাপ দেখতে পাবেন। তাৎক্ষণিক পেআউটের নিশ্চয়তা দেওয়া হয় না।",
        "Timing depends on payment verification, the provider, and service hours. Track every step in your dashboard. Payouts are manually processed rather than guaranteed to be instant.",
      ),
    ],
    [
      t("কোনো অতিরিক্ত বা লুকানো ফি আছে?", "Are there any hidden charges?"),
      t(
        "না। কনফার্ম করার আগে রেট, ফি ও প্রাপ্য পরিমাণ দেখানো হয়। পেমেন্ট প্রোভাইডার নিজস্ব ফি নিতে পারে।",
        "Your rate, platform fee, and received amount are shown before confirmation. Your payment provider may apply its own fees.",
      ),
    ],
    [
      t(
        "কোন পেমেন্ট মাধ্যম ব্যবহার করা যাবে?",
        "Which payment methods can I use?",
      ),
      t(
        "সক্রিয় মেথড ও পেয়ার ক্যালকুলেটরে দেখানো হয়। USDT পাঠানোর আগে নেটওয়ার্ক মিলিয়ে নিন।",
        "The calculator shows all currently enabled methods and pairs. Always check the configured network before sending USDT.",
      ),
    ],
    [
      t("পেমেন্টের সময় শেষ হলে কী হবে?", "What if my checkout expires?"),
      t(
        "সময় শেষ হলে নতুন পেমেন্ট করবেন না। ইতোমধ্যে পেমেন্ট করলে প্রমাণ জমা দিন; অর্ডার ম্যানুয়াল রিভিউতে যাবে।",
        "Do not make a new payment after checkout expires. If you already paid, submit your proof for manual review.",
      ),
    ],
  ];
  return (
    <>
      <SiteHeader />
      <main id="main">
        <div className="border-b border-border/60 bg-accent/60">
          <div className="page-width flex min-h-9 items-center justify-center gap-2 py-2 text-center text-[10px] text-primary">
            <span className="size-1.5 shrink-0 rounded-full bg-primary" />
            {data.demo
              ? t(data.notice, data.noticeEn)
              : t(
                  data.notice || "প্রতিটি এক্সচেঞ্জে স্বচ্ছতা ও নিরাপত্তা।",
                  data.noticeEn || "A clearer, safer way to exchange.",
                )}
            <ArrowUpRight className="size-3 shrink-0" />
            {data.serviceHours && (
              <span className="ml-3 hidden border-l border-primary/15 pl-3 text-muted-foreground md:inline">
                {data.serviceHours}
              </span>
            )}
          </div>
        </div>
        <section className="relative overflow-hidden pb-16 pt-12 lg:pb-20 lg:pt-18">
          <div
            aria-hidden="true"
            className="hero-grid pointer-events-none absolute inset-y-0 -right-40 w-[850px]"
          />
          <div className="page-width relative grid items-center gap-14 lg:grid-cols-[1.12fr_1fr] lg:gap-20">
            <Reveal {...fade} className="max-w-xl">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border bg-card px-3.5 py-2 text-[10px] font-medium shadow-xs">
                <span
                  className={`size-1.5 rounded-full ${data.online ? "bg-primary" : "bg-amber-500"}`}
                />
                {data.demo
                  ? t(
                      "একটি সুন্দর এক্সচেঞ্জ অভিজ্ঞতা",
                      "YOUR EVERYDAY EXCHANGE PARTNER",
                    )
                  : data.online
                    ? t(
                        "আমরা এখন অনলাইনে আছি",
                        "WE’RE ONLINE AND READY TO HELP",
                      )
                    : t("বর্তমানে অফলাইন", "CURRENTLY OFFLINE")}
                <span className="ml-1 border-l pl-2 text-muted-foreground">
                  BD
                </span>
              </div>
              <h1 className="text-balance text-[43px] font-semibold leading-[1.27] tracking-[-.04em] sm:text-[58px] lg:text-[66px]">
                {t("আপনার টাকা।", "Your money.")}
                <br />
                <span className="relative inline-block text-primary">
                  {t("নতুন সম্ভাবনা।", "More possibilities.")}
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 430 14"
                    preserveAspectRatio="none"
                    className="absolute -bottom-2 left-0 h-3 w-full text-primary/25"
                  >
                    <path
                      d="M3 10Q195-3 426 8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>
              <p className="mt-7 max-w-[420px] text-[15px] leading-8 text-muted-foreground">
                {t(
                  "লোকাল টাকা থেকে গ্লোবাল কারেন্সি—সব এক জায়গায়। স্বচ্ছ রেট ও বিশ্বস্ত মানুষের সাথে সহজে এক্সচেঞ্জ করুন।",
                  "From local wallets to global opportunities. Exchange your currencies with transparent rates and real people you can count on.",
                )}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-[11px] font-medium">
                {[
                  t("স্বচ্ছ রেট", "Transparent rates"),
                  t("নিরাপদ লেনদেন", "Secure exchanges"),
                  t("মানুষের সহায়তা", "Real human support"),
                ].map((label) => (
                  <span key={label} className="flex items-center gap-1.5">
                    <span className="flex size-4 items-center justify-center rounded-full bg-accent text-primary">
                      <Check className="size-2.5" strokeWidth={3} />
                    </span>
                    {label}
                  </span>
                ))}
              </div>
              <div className="mt-10 flex items-center gap-4 border-t border-border/80 pt-6">
                <div className="flex -space-x-2">
                  {[ShieldCheck, Globe2, Headphones].map((Icon, i) => (
                    <span
                      key={i}
                      className="flex size-10 items-center justify-center rounded-full border-[3px] border-background bg-accent text-primary"
                    >
                      <Icon className="size-4" />
                    </span>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-semibold">
                    {t(
                      "ডিজিটাল এক্সচেঞ্জ, মানুষের যত্নে।",
                      "Digital exchange. Human connection.",
                    )}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {t(
                      "প্রতিটি পেমেন্ট অ্যাডমিন দ্বারা যাচাইকৃত",
                      "Every payment checked by an administrator",
                    )}
                  </p>
                </div>
              </div>
            </Reveal>
            <Reveal
              {...fade}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="mx-auto w-full max-w-[480px]"
            >
              <ExchangeCalculator data={data} />
            </Reveal>
          </div>
        </section>
        <section className="border-y bg-card/70">
          <div className="page-width flex flex-wrap items-center justify-center gap-x-10 gap-y-5 py-7 sm:justify-between">
            <p className="text-[10px] font-medium leading-5 text-muted-foreground">
              {t("আপনার পরিচিত মাধ্যম।", "FAMILIAR WALLETS.")}
              <br />
              {t("আরও বেশি সম্ভাবনা।", "MORE POSSIBILITIES.")}
            </p>
            {["bKash", "Nagad", "Payoneer", "Tether", "Skrill"].map((name) => (
              <div
                key={name}
                className="flex items-center gap-1.5 opacity-70 grayscale transition-all hover:opacity-100 hover:grayscale-0"
              >
                <MethodIcon
                  name={name}
                  className="size-7 bg-transparent! text-xl"
                />
                <span className="text-lg font-bold tracking-tight">
                  {name === "Tether"
                    ? "tether"
                    : name === "Skrill"
                      ? "skrill"
                      : name}
                </span>
              </div>
            ))}
          </div>
        </section>
        <section id="reserves" className="page-width py-15">
          <Reveal
            {...fade}
            className="mb-7 flex flex-wrap items-end justify-between gap-3"
          >
            <div>
              <p className="eyebrow mb-2 text-primary">
                {t("এক্সচেঞ্জের জন্য প্রস্তুত", "READY WHEN YOU ARE")}
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">
                {t("আমাদের উপলব্ধ রিজার্ভ", "Our available reserves")}
              </h2>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" />
              {data.demo
                ? t("নমুনা ব্যালেন্স", "Sample balances")
                : t("প্রতি ১০ সেকেন্ডে আপডেট", "Updated every 10 seconds")}
            </span>
          </Reveal>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {data.methods.map((method, i) => (
              <Reveal
                {...fade}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                key={method.id}
                className="group rounded-2xl border bg-card p-5 transition-shadow hover:shadow-lg hover:shadow-primary/4"
              >
                <div className="mb-5 flex items-center justify-between">
                  <MethodIcon name={method.name} color={method.color} />
                  <ArrowUpRight className="size-4 text-muted-foreground/50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  {method.name}
                  {method.network && (
                    <span className="ml-1 text-[9px]">{method.network}</span>
                  )}
                </p>
                <p className="mt-1.5 font-sans text-[22px] font-semibold tracking-tight">
                  {money(method.reserve, method.currency)}{" "}
                  <span className="text-[10px] font-normal text-muted-foreground">
                    {method.currency}
                  </span>
                </p>
                <div className="mt-4 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full bg-primary/50 ${Number(method.reserve) > 0 && method.enabled ? "w-full" : "w-0"}`}
                  />
                </div>
                <p className="mt-2.5 text-[9px] text-muted-foreground">
                  {Number(method.reserve) > 0 && method.enabled
                    ? t("এক্সচেঞ্জের জন্য উপলব্ধ", "Available to exchange")
                    : t("বর্তমানে উপলব্ধ নয়", "Currently unavailable")}
                </p>
              </Reveal>
            ))}
          </div>
          {!data.methods.length && (
            <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              {t(
                "পেমেন্ট মেথড কনফিগার করা হচ্ছে। শীঘ্রই ফিরে আসুন।",
                "Payment methods are being configured. Please check back soon.",
              )}
            </div>
          )}
        </section>
        <section id="activity" className="page-width pb-16">
          <Reveal
            {...fade}
            className="mb-7 flex flex-wrap items-end justify-between gap-3"
          >
            <div>
              <p className="eyebrow mb-2 text-primary">
                {t(
                  "স্বচ্ছতা প্রতিটি ধাপে",
                  "TRANSPARENCY IN EVERY TRANSACTION",
                )}
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">
                {t("সাম্প্রতিক এক্সচেঞ্জ", "Exchanges, happening now")}
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-[10px]">
              <Radio className="size-3 text-primary" />
              {data.demo
                ? t("ডেমো অ্যাক্টিভিটি", "Demo activity")
                : t("লাইভ অ্যাক্টিভিটি", "Live activity")}
            </span>
          </Reveal>
          <div className="overflow-hidden rounded-2xl border bg-card">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    {[
                      t("ব্যবহারকারী", "CUSTOMER"),
                      t("এক্সচেঞ্জ পেয়ার", "EXCHANGE PAIR"),
                      t("পরিমাণ", "AMOUNT"),
                      t("স্ট্যাটাস", "STATUS"),
                      t("সময়", "TIME"),
                    ].map((label) => (
                      <th key={label}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.activity.map((order, i) => (
                    <tr key={order.id}>
                      <td>
                        <span className="flex items-center gap-2.5">
                          <span
                            className={`flex size-8 items-center justify-center rounded-full text-[10px] font-semibold ${i % 2 ? "bg-orange-500/8 text-orange-700 dark:text-orange-300" : "bg-primary/8 text-primary"}`}
                          >
                            {order.user.slice(0, 2).toUpperCase()}
                          </span>
                          <span className="font-sans text-xs text-muted-foreground">
                            {order.user}
                          </span>
                        </span>
                      </td>
                      <td>
                        <span className="flex items-center gap-2 text-xs font-medium">
                          <MethodIcon
                            name={order.from}
                            className="size-6 rounded-md text-xs"
                          />
                          {order.from}
                          <ArrowRight className="mx-1 size-3 text-muted-foreground" />
                          <MethodIcon
                            name={order.to}
                            className="size-6 rounded-md text-xs"
                          />
                          {order.to}
                        </span>
                      </td>
                      <td className="font-sans font-semibold">
                        {money(order.amount, order.currency)}{" "}
                        <span className="text-[10px] font-normal text-muted-foreground">
                          {order.currency}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="text-[11px] text-muted-foreground">
                        {data.demo
                          ? t("নমুনা", "Sample")
                          : new Date(order.createdAt).toLocaleTimeString(
                              locale === "bn" ? "bn-BD" : "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                timeZone: "Asia/Dhaka",
                              },
                            )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!data.activity.length && (
              <p className="p-12 text-center text-sm text-muted-foreground">
                {t(
                  "এখনও কোনো এক্সচেঞ্জ নেই। নতুন অর্ডার এখানে দেখা যাবে।",
                  "No exchanges yet. New orders will appear here.",
                )}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <LockKeyhole className="size-3" />
                {t(
                  "আপনার পরিচয় সবসময় গোপন রাখা হয়",
                  "Your personal details are always kept private",
                )}
              </span>
              <Link
                href="/dashboard"
                className="flex items-center gap-1 font-medium text-primary"
              >
                {t("আপনার অর্ডার দেখুন", "Track your exchange")}
                <ArrowUpRight className="size-3" />
              </Link>
            </div>
          </div>
          {error && (
            <p
              role="status"
              className="mt-3 text-xs text-amber-700 dark:text-amber-400"
            >
              {t(
                "আপডেট পেতে সমস্যা হচ্ছে। শেষ প্রাপ্ত তথ্য দেখানো হচ্ছে।",
                "Connection interrupted. Showing the last available update.",
              )}
            </p>
          )}
        </section>
        <section id="how-it-works" className="border-y bg-muted/45 py-16">
          <div className="page-width">
            <Reveal {...fade} className="mx-auto mb-12 max-w-xl text-center">
              <p className="eyebrow mb-3 text-primary">
                {t("কোনো জটিলতা নয়", "LESS FRICTION. MORE FREEDOM.")}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight">
                {t(
                  "এক্সচেঞ্জ এখন এতটাই সহজ",
                  "Good exchanges don’t need to be complicated.",
                )}
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                {t(
                  "মাত্র কয়েকটি ধাপ। বাকিটা আমাদের দায়িত্ব।",
                  "A few simple steps. Real people taking care of the rest.",
                )}
              </p>
            </Reveal>
            <div className="relative grid gap-8 md:grid-cols-4">
              <div
                aria-hidden="true"
                className="absolute left-[12%] right-[12%] top-7 hidden border-t border-dashed border-primary/25 md:block"
              />
              {[
                {
                  icon: ArrowLeftRight,
                  title: t("মাধ্যম বেছে নিন", "Make it yours"),
                  text: t(
                    "কারেন্সি ও পরিমাণ নির্বাচন করে রেট দেখুন।",
                    "Pick your currencies and see exactly what you’ll receive.",
                  ),
                },
                {
                  icon: Wallet,
                  title: t("পেমেন্ট করুন", "Send your payment"),
                  text: t(
                    "নির্দেশনা অনুযায়ী প্রদর্শিত অ্যাকাউন্টে পাঠান।",
                    "Follow the instructions to pay the account shown.",
                  ),
                },
                {
                  icon: Send,
                  title: t("প্রমাণ জমা দিন", "Share the details"),
                  text: t(
                    "TrxID এবং প্রাপকের তথ্য কনফার্ম করুন।",
                    "Submit your transaction ID and receiving details.",
                  ),
                },
                {
                  icon: CircleCheck,
                  title: t("পেয়ে যান কারেন্সি", "We’ll take it from here"),
                  text: t(
                    "যাচাই শেষে আপনার অ্যাকাউন্টে পেআউট পাবেন।",
                    "We verify your payment and complete your payout.",
                  ),
                },
              ].map(({ icon: Icon, title, text }, i) => (
                <Reveal {...fade} key={i} className="relative text-center">
                  <div className="relative mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl border border-primary/15 bg-card text-primary shadow-sm">
                    <Icon className="size-5" />
                    <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full border-2 border-background bg-primary font-sans text-[9px] text-primary-foreground">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="mb-2 text-sm font-semibold">{title}</h3>
                  <p className="mx-auto max-w-[220px] text-xs leading-6 text-muted-foreground">
                    {text}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
        <section className="page-width grid gap-10 py-16 lg:grid-cols-[.85fr_1.15fr]">
          <Reveal {...fade}>
            <p className="eyebrow mb-3 text-primary">
              {t("বিশ্বাস থেকে শুরু", "BUILT AROUND YOUR PEACE OF MIND")}
            </p>
            <h2 className="max-w-sm text-3xl font-semibold leading-snug tracking-tight">
              {t(
                "আপনার বিশ্বাস। আমাদের অগ্রাধিকার।",
                "Your trust. Our everyday priority.",
              )}
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-7 text-muted-foreground">
              {t(
                "শুধু কারেন্সি নয়, আমরা এক্সচেঞ্জ করি আস্থা। প্রতিটি ধাপে আপনি জানবেন কী হচ্ছে।",
                "Money is personal. We keep you informed, protect your details, and put a real person behind every exchange.",
              )}
            </p>
            <a
              href="#exchange"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary"
            >
              {t("নিশ্চিন্তে শুরু করুন", "Exchange with confidence")}
              <ArrowUpRight className="size-4" />
            </a>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: ShieldCheck,
                title: t("যাচাইকৃত প্রতিটি পেমেন্ট", "People, not guesswork"),
                text: t(
                  "প্রতিটি পেমেন্ট যাচাই করে তবেই পেআউট করা হয়।",
                  "An administrator checks your payment before every payout.",
                ),
              },
              {
                icon: Layers3,
                title: t("সব তথ্য আপনার সামনে", "What you see is what you get"),
                text: t(
                  "রেট, ফি ও প্রাপ্য পরিমাণ একদম স্পষ্ট।",
                  "Clear rates, visible fees, and a full breakdown upfront.",
                ),
              },
              {
                icon: LockKeyhole,
                title: t("আপনার তথ্য সুরক্ষিত", "Your details stay yours"),
                text: t(
                  "পাবলিক বোর্ডে ব্যক্তিগত তথ্য গোপন থাকে।",
                  "Personal payment details never appear on our public board.",
                ),
              },
              {
                icon: Headphones,
                title: t("পাশে আছে মানুষ", "A human on your side"),
                text: t(
                  "অর্ডারের অগ্রগতি ও সহায়তা এক জায়গায়।",
                  "Follow your order’s progress and get help when you need it.",
                ),
              },
            ].map(({ icon: Icon, title, text }, i) => (
              <Reveal
                {...fade}
                key={i}
                className="rounded-2xl border bg-card p-5"
              >
                <Icon className="mb-4 size-5 text-primary" />
                <h3 className="mb-2 text-sm font-semibold">{title}</h3>
                <p className="text-xs leading-6 text-muted-foreground">
                  {text}
                </p>
              </Reveal>
            ))}
          </div>
        </section>
        <section id="faq" className="page-width pb-16">
          <div className="grid gap-10 border-t pt-14 lg:grid-cols-[.85fr_1.15fr]">
            <div>
              <span className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-accent text-primary">
                <CircleHelp className="size-5" />
              </span>
              <h2 className="text-3xl font-semibold tracking-tight">
                {t("জানতে চান আরও কিছু?", "A little more clarity.")}
              </h2>
              <p className="mt-4 max-w-xs text-sm leading-7 text-muted-foreground">
                {t(
                  "আপনার প্রশ্নের উত্তর এখানেই। আত্মবিশ্বাসের সাথে পরের ধাপে যান।",
                  "Good questions deserve clear answers. Here are a few to help you get started.",
                )}
              </p>
            </div>
            <div>
              {faqs.map(([question, answer], i) => (
                <details key={i} className="group border-b py-5 first:pt-0">
                  <summary className="flex list-none items-center justify-between gap-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
                    {question}
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-4 pr-5 text-xs leading-7 text-muted-foreground">
                    {answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <section className="page-width pb-16">
          <Reveal
            {...fade}
            className="relative overflow-hidden rounded-3xl bg-[#123f31] px-6 py-10 text-white sm:px-12"
          >
            <div
              aria-hidden="true"
              className="absolute -right-10 -top-24 size-80 rounded-full border-[40px] border-white/4"
            />
            <div className="relative flex flex-wrap items-center justify-between gap-7">
              <div>
                <p className="eyebrow mb-3 text-emerald-300/80">
                  {t("আপনার পরবর্তী পদক্ষেপ", "YOUR NEXT MOVE STARTS HERE")}
                </p>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {t("এক্সচেঞ্জ হোক আরও সহজ।", "Make your money go places.")}
                </h2>
                <p className="mt-3 text-xs text-white/60">
                  {t(
                    "পরিষ্কার রেট। সহজ ধাপ। নিশ্চিন্ত আপনি।",
                    "Clear rates. Simple steps. A little peace of mind.",
                  )}
                </p>
              </div>
              <Button
                asChild
                className="bg-white text-[#123f31] hover:bg-white/90"
              >
                <a href="#exchange">
                  {t("এক্সচেঞ্জ শুরু করুন", "Let’s make an exchange")}
                  <ArrowUpRight />
                </a>
              </Button>
            </div>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
