import Link from "next/link";
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 p-8 text-center">
      <p className="text-sm text-primary">404 · ExchangeHub</p>
      <h1 className="text-2xl font-semibold">
        পৃষ্ঠা পাওয়া যায়নি · Page not found
      </h1>
      <Link
        href="/"
        className="rounded-xl bg-primary px-5 py-3 text-sm text-primary-foreground"
      >
        হোমে ফিরুন · Back home
      </Link>
    </div>
  );
}
