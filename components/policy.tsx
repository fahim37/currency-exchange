"use client";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { useLocale } from "./providers";
export function Policy({ privacy = false }: { privacy?: boolean }) {
  const { t } = useLocale();
  const entries = privacy
    ? [
        [
          t("আমরা কী তথ্য রাখি", "Information we store"),
          t(
            "অ্যাকাউন্টের নাম, ইমেইল, সেশন, সেভ করা অ্যাকাউন্ট ও এক্সচেঞ্জের জন্য প্রয়োজনীয় পেমেন্ট তথ্য সংরক্ষণ করা হয়। পাসওয়ার্ড হ্যাশ করে রাখা হয়।",
            "We store your name, email, sessions, saved receiving accounts, and payment details needed for your exchanges. Passwords are stored as hashes.",
          ),
        ],
        [
          t("তথ্য কীভাবে ব্যবহৃত হয়", "How information is used"),
          t(
            "অ্যাকাউন্ট যাচাই, পেমেন্ট যাচাই, পেআউট, সহায়তা ও অপব্যবহার ঠেকাতে তথ্য ব্যবহৃত হয়। অ্যাডমিন প্রয়োজনীয় অর্ডার তথ্য দেখতে পারেন।",
            "Information supports account access, payment verification, payouts, customer support, and abuse prevention. Administrators can access the order details needed for these tasks.",
          ),
        ],
        [
          t("পাবলিক অ্যাক্টিভিটি", "Public exchange activity"),
          t(
            "পাবলিক তালিকায় পরিচয় মাস্ক করা হয়। সেখানে পুরো ইমেইল, ফোন, ওয়ালেট বা TrxID দেখানো হয় না।",
            "The public board masks customer identifiers. Full email addresses, phone numbers, wallets, and payment transaction IDs are not published there.",
          ),
        ],
        [
          t("আপনার পছন্দ", "Your preferences"),
          t(
            "ব্রাউজারে থিম ও ভাষার পছন্দ সংরক্ষণ করা হয়। প্রোফাইল থেকে সেভ করা প্রাপক অ্যাকাউন্ট মুছে ফেলতে পারবেন।",
            "Your theme and language preferences are stored in your browser. You can remove saved receiving accounts from your profile.",
          ),
        ],
      ]
    : [
        [
          t("সার্ভিস সম্পর্কে", "About the service"),
          t(
            "ExchangeHub-এ লেনদেন অ্যাডমিন দ্বারা ম্যানুয়ালি যাচাই ও সম্পন্ন হয়। সক্রিয় রেট, ফি ও সীমা চেকআউটের আগে দেখানো হয়।",
            "Exchanges are manually verified and fulfilled by administrators. Active rates, fees, and limits are displayed before checkout.",
          ),
        ],
        [
          t("পেমেন্ট ও অ্যাকাউন্ট", "Payments and account details"),
          t(
            "শুধুমাত্র চেকআউটে প্রদর্শিত অ্যাকাউন্টে পেমেন্ট করুন। প্রাপক ও নেটওয়ার্কের সঠিক তথ্য দেওয়ার দায়িত্ব আপনার। একই TrxID একাধিক অর্ডারে ব্যবহার করা যাবে না।",
            "Send funds only to the account shown at checkout. You are responsible for accurate receiving details and the correct network. A payment transaction ID cannot be reused across orders.",
          ),
        ],
        [
          t("সময় ও রেট লক", "Timing and rate locks"),
          t(
            "চেকআউটের রেট ১৫ মিনিট লক থাকে। মেয়াদ শেষে নতুন পেমেন্ট করবেন না। ইতোমধ্যে পাঠানো পেমেন্টের প্রমাণ ম্যানুয়াল রিভিউ হবে। প্রসেসিংয়ের সময় প্রোভাইডার ও সার্ভিস আওয়ারের ওপর নির্ভর করে।",
            "Checkout rates are held for 15 minutes. Do not send new funds after expiry. Proof of an existing late payment is reviewed manually. Processing time depends on the provider and service hours.",
          ),
        ],
        [
          t("বাতিল ও রিফান্ড", "Cancellation and refunds"),
          t(
            "সমস্যা হলে অ্যাডমিন কারণসহ অর্ডার বাতিল করতে পারেন। যাচাইকৃত পেমেন্টের রিফান্ড আলাদা স্ট্যাটাস ও রেফারেন্সসহ ট্র্যাক করা হয়।",
            "Administrators may cancel an order with a recorded reason. Refunds for verified payments are tracked separately with their status and transaction reference.",
          ),
        ],
      ];
  return (
    <>
      <SiteHeader />
      <main id="main" className="page-width min-h-[70vh] py-14">
        <div className="mx-auto max-w-2xl">
          <p className="eyebrow mb-3 text-primary">ExchangeHub</p>
          <h1 className="mb-10 text-3xl font-semibold">
            {privacy
              ? t("গোপনীয়তা নীতি", "Privacy policy")
              : t("সার্ভিসের শর্তাবলি", "Terms of service")}
          </h1>
          {entries.map(([title, body]) => (
            <section key={title} className="mb-8">
              <h2 className="mb-3 text-lg font-semibold">{title}</h2>
              <p className="text-sm leading-8 text-muted-foreground">{body}</p>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
