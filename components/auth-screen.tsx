"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  ShieldCheck,
  Check,
  Eye,
  EyeOff,
  Mail,
  LoaderCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { Logo, ThemeControls } from "./site-header";
import { useLocale } from "./providers";
import { Button } from "./ui/button";
import { Input, Label } from "./ui/input";
import { authClient } from "@/lib/auth-client";

export function AuthScreen({
  mode,
  configured,
  emailReady,
}: {
  mode: "login" | "signup" | "forgot" | "reset";
  configured: boolean;
  emailReady: boolean;
}) {
  const { t } = useLocale(),
    params = useSearchParams();
  const rawNext = params.get("next") || "/dashboard";
  const next =
    rawNext.startsWith("/") &&
    !rawNext.startsWith("//") &&
    !rawNext.includes("\\")
      ? rawNext
      : "/dashboard";
  const [show, setShow] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState(false),
    [email, setEmail] = useState("");
  const signup = mode === "signup",
    login = mode === "login";
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(e.currentTarget);
    const password = String(data.get("password") || "");
    try {
      const result = signup
        ? await authClient.signUp.email({
            name: String(data.get("name")),
            email,
            password,
            callbackURL: next,
          })
        : login
          ? await authClient.signIn.email({
              email,
              password,
              callbackURL: next,
            })
          : mode === "forgot"
            ? await authClient.requestPasswordReset({
                email,
                redirectTo: "/reset-password",
              })
            : await authClient.resetPassword({
                newPassword: password,
                token: params.get("token") || "",
              });
      if (result.error) {
        setError(
          t(
            "অনুরোধটি সম্পন্ন হয়নি। তথ্য যাচাই করুন; লগইনের আগে ইমেইল যাচাই করুন।",
            result.error.message ||
              "Check your details and verify your email before signing in.",
          ),
        );
        return;
      }
      if (login) window.location.assign(next);
      else setDone(true);
    } catch {
      setError(
        t(
          "সংযোগে সমস্যা হচ্ছে। আবার চেষ্টা করুন।",
          "Connection interrupted. Please try again.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#103f31] p-14 text-white lg:flex">
        <div className="[&_a]:text-white [&_span.text-primary]:text-emerald-300">
          <Logo />
        </div>
        <div
          aria-hidden="true"
          className="absolute -right-36 top-32 size-[570px] rounded-full border-[80px] border-white/3"
        />
        <div className="relative max-w-md">
          <span className="mb-8 inline-flex size-14 items-center justify-center rounded-2xl border border-white/15 bg-white/5">
            <ShieldCheck className="size-6 text-emerald-300" />
          </span>
          <h1 className="text-5xl font-semibold leading-tight tracking-tight">
            {t("একটু সহজ।", "A little simpler.")}
            <br />
            <span className="text-emerald-300">
              {t("অনেক নিশ্চিন্ত।", "A lot more confidence.")}
            </span>
          </h1>
          <p className="mt-6 text-sm leading-8 text-white/65">
            {t(
              "আপনার পরিচিত ওয়ালেট থেকে নতুন সম্ভাবনায়। প্রতিটি এক্সচেঞ্জে আমরা আছি আপনার পাশে।",
              "From the wallets you know to the possibilities ahead. We’re here for every step of your exchange.",
            )}
          </p>
          <div className="mt-10 space-y-3">
            {[
              t(
                "প্রতিটি পেমেন্ট ম্যানুয়ালি যাচাইকৃত",
                "Every payment verified by a real person",
              ),
              t("রেট ও ফি একদম স্বচ্ছ", "Transparent rates and clear fees"),
              t(
                "আপনার ব্যক্তিগত তথ্য গোপন থাকে",
                "Your personal details stay private",
              ),
            ].map((text) => (
              <p
                key={text}
                className="flex items-center gap-3 text-xs text-white/80"
              >
                <Check className="size-4 text-emerald-300" />
                {text}
              </p>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-white/40">
          © 2026 ExchangeHub ·{" "}
          {t(
            "মানুষের যত্নে ডিজিটাল এক্সচেঞ্জ",
            "Digital exchange. Human connection.",
          )}
        </p>
      </aside>
      <section className="flex min-h-screen flex-col">
        <div className="flex items-center justify-between p-6 sm:p-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <ArrowLeft className="size-4" />
            {t("হোমে ফিরুন", "Back to home")}
          </Link>
          <ThemeControls />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto my-auto w-full max-w-[420px] px-6 pb-16"
        >
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <p className="eyebrow mb-3 text-primary">
            {t("একসাথে আরও এগিয়ে", "YOUR POSSIBILITIES START HERE")}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight">
            {done
              ? t(
                  "আপনার ইনবক্স দেখুন",
                  mode === "reset" ? "Password updated" : "Check your inbox",
                )
              : signup
                ? t("নতুন অ্যাকাউন্ট খুলুন", "Make yourself at home.")
                : login
                  ? t("আবার স্বাগতম।", "Good to see you again.")
                  : mode === "forgot"
                    ? t("পাসওয়ার্ড ভুলে গেছেন?", "Forgot your password?")
                    : t("নতুন পাসওয়ার্ড দিন", "Set a new password")}
          </h2>
          <p className="mb-8 mt-3 text-sm leading-7 text-muted-foreground">
            {done
              ? mode === "reset"
                ? t(
                    "এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।",
                    "You can now sign in with your new password.",
                  )
                : t(
                    "ইমেইলে পাঠানো লিংক অনুসরণ করুন। স্প্যাম ফোল্ডারও দেখুন।",
                    "Follow the secure link in your email. Check your spam folder too.",
                  )
              : signup
                ? t(
                    "কয়েকটি তথ্য দিয়ে নিরাপদ এক্সচেঞ্জ শুরু করুন।",
                    "A few details, and you’re one step closer to your next exchange.",
                  )
                : login
                  ? t(
                      "আপনার এক্সচেঞ্জ যেখানে রেখেছিলেন, সেখান থেকেই শুরু করুন।",
                      "Pick up where you left off. Your next exchange is waiting.",
                    )
                  : t(
                      "আপনার অ্যাকাউন্টের নিরাপত্তা আমাদের অগ্রাধিকার।",
                      "Let’s get you securely back into your account.",
                    )}
          </p>
          {(!configured || (!emailReady && !login)) && (
            <div
              role="status"
              className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/8 p-4 text-xs leading-6 text-amber-800 dark:text-amber-300"
            >
              {!configured
                ? t(
                    "অ্যাকাউন্ট সার্ভিস চালু করতে MongoDB সংযোগ প্রয়োজন। আপনি আপাতত হোমপেজের ডেভেলপমেন্ট প্রিভিউ দেখতে পারেন।",
                    "Account services need a MongoDB connection. You can explore the development preview on the homepage.",
                  )
                : t(
                    "ইমেইল যাচাই ও রিসেটের জন্য SMTP কনফিগার করতে হবে।",
                    "Email verification and reset require SMTP configuration.",
                  )}
            </div>
          )}
          {done ? (
            <div className="rounded-2xl border bg-accent p-6">
              <Mail className="mb-3 size-7 text-primary" />
              <p className="text-sm">{email}</p>
              <Button asChild className="mt-5">
                <Link href={`/login?next=${encodeURIComponent(next)}`}>
                  {t("লগইনে যান", "Back to sign in")}
                  <ArrowUpRight />
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              {signup && (
                <div>
                  <Label htmlFor="name">{t("আপনার নাম", "Your name")}</Label>
                  <Input
                    id="name"
                    name="name"
                    autoComplete="name"
                    placeholder={t("পুরো নাম", "Full name")}
                    required
                    minLength={2}
                    maxLength={60}
                  />
                </div>
              )}
              {mode !== "reset" && (
                <div>
                  <Label htmlFor="email">
                    {t("ইমেইল ঠিকানা", "Email address")}
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              )}
              {mode !== "forgot" && (
                <div>
                  <div className="flex justify-between">
                    <Label htmlFor="password">
                      {t("পাসওয়ার্ড", "Password")}
                    </Label>
                    {login && (
                      <Link
                        href="/forgot-password"
                        className="text-xs text-primary"
                      >
                        {t("ভুলে গেছেন?", "Forgot password?")}
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={show ? "text" : "password"}
                      autoComplete={login ? "current-password" : "new-password"}
                      minLength={10}
                      maxLength={128}
                      placeholder={t(
                        "কমপক্ষে ১০ অক্ষর",
                        "At least 10 characters",
                      )}
                      required
                      className="pr-11"
                    />
                    <button
                      type="button"
                      aria-label={t(
                        "পাসওয়ার্ড দেখুন বা লুকান",
                        "Toggle password visibility",
                      )}
                      onClick={() => setShow(!show)}
                      className="absolute right-3 top-3 text-muted-foreground"
                    >
                      {show ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}
              {signup && (
                <label className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                  <input
                    type="checkbox"
                    required
                    className="mt-1 accent-primary"
                  />
                  <span>
                    {t(
                      "আমি শর্তাবলি ও গোপনীয়তা নীতিতে সম্মত।",
                      "I agree to the terms of service and privacy policy.",
                    )}{" "}
                    <Link href="/terms" className="text-primary underline">
                      {t("পড়ুন", "Read terms")}
                    </Link>
                  </span>
                </label>
              )}
              {error && (
                <p role="alert" className="field-error">
                  {error}
                </p>
              )}
              <Button
                className="w-full justify-between"
                size="lg"
                disabled={busy || !configured || (!emailReady && !login)}
              >
                {busy ? (
                  <LoaderCircle className="animate-spin" />
                ) : signup ? (
                  t("অ্যাকাউন্ট খুলুন", "Create your account")
                ) : login ? (
                  t("লগ ইন করুন", "Sign in to your account")
                ) : mode === "forgot" ? (
                  t("রিসেট লিংক পাঠান", "Send reset link")
                ) : (
                  t("পাসওয়ার্ড আপডেট করুন", "Update password")
                )}
                <ArrowUpRight />
              </Button>
            </form>
          )}
          {(login || signup) && !done && (
            <p className="mt-6 text-center text-xs text-muted-foreground">
              {login
                ? t("নতুন এখানে?", "New around here?")
                : t(
                    "আগেই অ্যাকাউন্ট আছে?",
                    "Already part of the community?",
                  )}{" "}
              <Link
                href={`/${login ? "signup" : "login"}?next=${encodeURIComponent(next)}`}
                className="font-medium text-primary"
              >
                {login
                  ? t("অ্যাকাউন্ট খুলুন", "Create an account")
                  : t("লগ ইন করুন", "Sign in")}
              </Link>
            </p>
          )}
          <div className="mt-10 flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" />
            {t(
              "আপনার নিরাপত্তা, সবসময় আগে।",
              "Your security always comes first.",
            )}
          </div>
        </motion.div>
      </section>
    </div>
  );
}
