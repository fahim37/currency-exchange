export const siteConfig = {
  name: "ExchangeHub",
  description:
    "A clearer way to exchange. Secure, administrator-verified currency exchange.",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "",
  quoteMinutes: 15,
};
export const demoEnabled = () =>
  process.env.EXCHANGE_DEMO_MODE === "true" &&
  process.env.NODE_ENV !== "production";
export const databaseConfigured = () => Boolean(process.env.DATABASE_URL);
