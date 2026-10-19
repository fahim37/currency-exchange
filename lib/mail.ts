import "server-only";
import nodemailer from "nodemailer";
import { siteConfig } from "./config";
export const mailConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
export async function sendAuthMail(to: string, subject: string, url: string) {
  if (!mailConfigured())
    throw new Error(
      "Email service is not configured. Contact the platform administrator.",
    );
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_PORT === "465",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
  await transport.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `${siteConfig.name} — ${subject}`,
    text: `${subject}\n\nOpen this secure link:\n${url}\n\nIf you did not request this, ignore this email.\nআপনি অনুরোধ না করলে এই ইমেইলটি উপেক্ষা করুন।`,
  });
}
