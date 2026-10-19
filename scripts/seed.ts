import "./env";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const definitions = [
    {
      slug: "bkash",
      name: "bKash",
      currency: "BDT",
      kind: "PHONE",
      color: "#e2136e",
      decimals: 2,
      network: null,
    },
    {
      slug: "nagad",
      name: "Nagad",
      currency: "BDT",
      kind: "PHONE",
      color: "#ed5125",
      decimals: 2,
      network: null,
    },
    {
      slug: "payoneer",
      name: "Payoneer",
      currency: "USD",
      kind: "EMAIL",
      color: "#ff672b",
      decimals: 2,
      network: null,
    },
    {
      slug: "usdt",
      name: "Tether",
      currency: "USDT",
      kind: "WALLET",
      color: "#26a17b",
      decimals: 6,
      network: "TRC20",
    },
    {
      slug: "skrill",
      name: "Skrill",
      currency: "USD",
      kind: "EMAIL",
      color: "#7d2671",
      decimals: 2,
      network: null,
    },
  ];
  for (const data of definitions)
    await db.paymentMethod.upsert({
      where: { slug: data.slug },
      create: { ...data, enabled: false, reserve: "0" },
      update: {},
    });
  await db.siteSettings.upsert({
    where: { key: "main" },
    create: {
      key: "main",
      online: false,
      acceptingOrders: false,
      notice: "সার্ভিস প্রস্তুত হচ্ছে। শীঘ্রই ফিরে আসুন।",
      noticeEn: "We’re getting things ready. Please check back soon.",
    },
    update: {},
  });
  console.log(
    "Payment method templates created. Existing configuration preserved. No example rates, orders, balances, or public administrators were added.",
  );
}
main()
  .catch((error) => {
    console.error(
      "Seed failed:",
      error instanceof Error ? error.name : "UnknownError",
      (error as { code?: string }).code || "",
    );
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
