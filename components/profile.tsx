"use client";
import { useState, type FormEvent } from "react";
import { Plus, Trash2, ShieldCheck, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "./providers";
import { useResource } from "@/hooks/use-resource";
import { ResourceState } from "./resource-state";
import { api, errorText } from "@/lib/client-api";
import { Button } from "./ui/button";
import { Input, Label } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import type { PublicData } from "@/lib/types";
interface ProfileData {
  user: { name: string; email: string; emailVerified: boolean; role: string };
  accounts: { id: string; label: string; address: string; methodId: string }[];
}
export function Profile() {
  const { t, locale } = useLocale(),
    { data, error, loading, refresh } =
      useResource<ProfileData>("/api/profile"),
    { data: publicData } = useResource<PublicData>("/api/public");
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [formError, setError] = useState("");
  async function save(e: FormEvent<HTMLFormElement>, account = false) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await api("/api/profile", account ? "POST" : "PATCH", body);
      toast.success(t("সেভ হয়েছে", "Saved successfully"));
      setOpen(false);
      await refresh();
    } catch (e) {
      setError(errorText(e, locale));
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    try {
      await api("/api/profile", "DELETE", { id });
      await refresh();
      toast.success(t("মুছে ফেলা হয়েছে", "Account removed"));
    } catch (e) {
      toast.error(errorText(e, locale));
    }
  }
  if (!data)
    return <ResourceState loading={loading} error={error} retry={refresh} />;
  return (
    <>
      <p className="eyebrow mb-2 text-primary">
        {t("আপনার মতো করে", "MAKE YOURSELF AT HOME")}
      </p>
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">
        {t("প্রোফাইল ও অ্যাকাউন্ট", "Profile & accounts")}
      </h1>
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border bg-card p-6">
          <h2 className="mb-6 text-lg font-semibold">
            {t("ব্যক্তিগত তথ্য", "The essentials")}
          </h2>
          <form onSubmit={(e) => save(e)} className="space-y-5">
            <div>
              <Label htmlFor="profile-name">{t("নাম", "Your name")}</Label>
              <Input
                id="profile-name"
                name="name"
                required
                minLength={2}
                maxLength={60}
                defaultValue={data.user.name}
              />
            </div>
            <div>
              <Label htmlFor="profile-email">
                {t("ইমেইল", "Email address")}
              </Label>
              <Input id="profile-email" value={data.user.email} disabled />
              <span className="mt-2 flex items-center gap-1.5 text-xs text-primary">
                <ShieldCheck className="size-3" />
                {data.user.emailVerified
                  ? t("যাচাইকৃত", "Verified email")
                  : t("যাচাই প্রয়োজন", "Verification required")}
              </span>
            </div>
            <Button disabled={busy}>
              {t("তথ্য সেভ করুন", "Save changes")}
            </Button>
          </form>
          <a
            href="/forgot-password"
            className="mt-6 inline-block text-xs text-primary underline"
          >
            {t("ইমেইল দিয়ে পাসওয়ার্ড রিসেট করুন", "Reset password by email")}
          </a>
          {formError && !open && (
            <p role="alert" className="field-error">
              {formError}
            </p>
          )}
        </section>
        <section className="rounded-2xl border bg-card p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">
              {t("সেভ করা অ্যাকাউন্ট", "Your saved accounts")}
            </h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setOpen(true);
                setError("");
              }}
            >
              <Plus />
              {t("যোগ করুন", "Add account")}
            </Button>
          </div>
          <div className="space-y-3">
            {data.accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-start gap-3 rounded-xl border p-4"
              >
                <span className="rounded-lg bg-accent p-2 text-primary">
                  <Wallet className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{account.label}</p>
                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    {account.address}
                  </p>
                  <p className="mt-1 text-[10px] text-primary">
                    {
                      publicData?.methods.find((m) => m.id === account.methodId)
                        ?.name
                    }
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`${t("অ্যাকাউন্ট মুছুন", "Remove account")} ${account.label}`}
                  onClick={() => remove(account.id)}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
            {!data.accounts.length && <ResourceState empty />}
          </div>
        </section>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle className="text-xl font-semibold">
            {t("প্রাপক অ্যাকাউন্ট যোগ করুন", "A shortcut for next time")}
          </DialogTitle>
          <DialogDescription className="mb-6 mt-2 text-xs text-muted-foreground">
            {t(
              "চেকআউটে দ্রুত নির্বাচন করতে অ্যাকাউন্ট সেভ করুন।",
              "Save a receiving account to choose it quickly at checkout.",
            )}
          </DialogDescription>
          <form onSubmit={(e) => save(e, true)} className="space-y-4">
            <div>
              <Label htmlFor="account-method">
                {t("মাধ্যম", "Payment method")}
              </Label>
              <select
                id="account-method"
                name="methodId"
                required
                className="select-field"
              >
                <option value="">
                  {t("নির্বাচন করুন", "Select a method")}
                </option>
                {publicData?.methods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                    {m.network ? ` · ${m.network}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="account-label">
                {t("নাম", "Account nickname")}
              </Label>
              <Input
                id="account-label"
                name="label"
                required
                minLength={2}
                maxLength={40}
                placeholder={t("আমার ওয়ালেট", "My everyday wallet")}
              />
            </div>
            <div>
              <Label htmlFor="account-address">
                {t(
                  "ইমেইল / নম্বর / ওয়ালেট",
                  "Email / number / wallet address",
                )}
              </Label>
              <Input
                id="account-address"
                name="address"
                required
                maxLength={200}
              />
            </div>
            {formError && (
              <p role="alert" className="field-error">
                {formError}
              </p>
            )}
            <Button disabled={busy} className="w-full">
              {t("অ্যাকাউন্ট সেভ করুন", "Save account")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
