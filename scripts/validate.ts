import { config } from "dotenv";
import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { SMTPServer } from "smtp-server";
import { simpleParser } from "mailparser";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
config({ path: ".env.local", quiet: true });
const original = process.env.DATABASE_URL;
if (!original) throw new Error("Configure DATABASE_URL before validation.");
const url = new URL(original);
const databaseName = `exchangehub_validation_${Date.now()}`;
url.pathname = `/${databaseName}`;
const password = `Validation!${randomBytes(12).toString("hex")}`;
const env = {
  ...process.env,
  DATABASE_URL: url.toString(),
  TEST_DATABASE_URL: url.toString(),
  TEST_BASE_URL: "http://localhost:3100",
  BETTER_AUTH_URL: "http://localhost:3100",
  BETTER_AUTH_SECRET: randomBytes(32).toString("hex"),
  EXCHANGE_DEMO_MODE: "false",
  SMTP_HOST: "127.0.0.1",
  SMTP_PORT: "2526",
  SMTP_USER: "",
  SMTP_PASSWORD: "",
  SMTP_FROM: "ExchangeHub <test@example.test>",
  TEST_PASSWORD: password,
};
const db = new PrismaClient({ datasourceUrl: url.toString() });
const mails: { to: string; text: string; subject: string }[] = [];
const smtp = new SMTPServer({
  authOptional: true,
  disabledCommands: ["AUTH", "STARTTLS"],
  onData(stream, _session, callback) {
    simpleParser(stream)
      .then((mail) => {
        mails.push({
          to: Array.isArray(mail.to)
            ? mail.to[0]?.text || ""
            : mail.to?.text || "",
          text: mail.text || "",
          subject: mail.subject || "",
        });
        callback();
      })
      .catch(callback);
  },
});
const inbox = createServer((_request, response) => {
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(mails));
});
function run(file: string, args: string[] = []) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [file, ...args], {
      env,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`Validation command failed (${code})`)),
    );
  });
}
let server: ChildProcess | undefined;
async function main() {
  console.log(
    "Validating in a new isolated database. Application data is untouched.",
  );
  await run("node_modules/prisma/build/index.js", [
    "db",
    "push",
    "--skip-generate",
  ]);
  await run("node_modules/vitest/vitest.mjs", ["run"]);
  await db.auditEvent.deleteMany();
  await db.order.deleteMany();
  await db.quote.deleteMany();
  await db.savedAccount.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.user.deleteMany();
  await db.exchangePair.deleteMany();
  await db.paymentMethod.deleteMany();
  const hash = await hashPassword(password);
  for (const [email, name, role] of [
    ["admin@example.test", "Validation Admin", "ADMIN"],
    ["customer@example.test", "Validation Customer", "USER"],
    ["other@example.test", "Other Customer", "USER"],
  ]) {
    const user = await db.user.create({
      data: { email, name, role, emailVerified: true },
    });
    await db.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: hash,
      },
    });
  }
  for (const data of [
    {
      slug: "bkash",
      name: "bKash",
      currency: "BDT",
      kind: "PHONE",
      color: "#e2136e",
      reserve: "850000",
      receivingAccount: "01712345678",
      network: null,
      decimals: 2,
    },
    {
      slug: "nagad",
      name: "Nagad",
      currency: "BDT",
      kind: "PHONE",
      color: "#ed5125",
      reserve: "420000",
      receivingAccount: "01812345678",
      network: null,
      decimals: 2,
    },
    {
      slug: "payoneer",
      name: "Payoneer",
      currency: "USD",
      kind: "EMAIL",
      color: "#ff672b",
      reserve: "12500",
      receivingAccount: "platform@example.test",
      network: null,
      decimals: 2,
    },
    {
      slug: "usdt",
      name: "Tether",
      currency: "USDT",
      kind: "WALLET",
      color: "#26a17b",
      reserve: "24800",
      receivingAccount: "T" + "A".repeat(33),
      network: "TRC20",
      decimals: 6,
    },
    {
      slug: "skrill",
      name: "Skrill",
      currency: "USD",
      kind: "EMAIL",
      color: "#7d2671",
      reserve: "6500",
      receivingAccount: "skrill@example.test",
      network: null,
      decimals: 2,
    },
  ])
    await db.paymentMethod.create({
      data: {
        ...data,
        enabled: true,
        instructions: "টেস্ট পেমেন্ট নির্দেশনা। বাস্তব টাকা পাঠাবেন না।",
        instructionsEn: "Test payment instructions. Do not send real funds.",
      },
    });
  const methods = await db.paymentMethod.findMany();
  for (const from of methods)
    for (const to of methods)
      if ((from.currency === "BDT") !== (to.currency === "BDT"))
        await db.exchangePair.create({
          data: {
            fromId: from.id,
            toId: to.id,
            rate: from.currency === "BDT" ? "0.008" : "121.5",
            min: from.currency === "BDT" ? "1000" : "10",
            max: from.currency === "BDT" ? "100000" : "1000",
            enabled: true,
          },
        });
  await db.siteSettings.update({
    where: { key: "main" },
    data: {
      online: true,
      acceptingOrders: true,
      notice: "স্বয়ংক্রিয় পরীক্ষা · বাস্তব টাকা পাঠাবেন না",
      noticeEn: "Automated validation · Do not send real money",
    },
  });
  await new Promise<void>((resolve) => smtp.listen(2526, "127.0.0.1", resolve));
  await new Promise<void>((resolve) =>
    inbox.listen(3102, "127.0.0.1", resolve),
  );
  await run("node_modules/next/dist/bin/next", ["build"]);
  server = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "-p", "3100"],
    { env, stdio: "inherit" },
  );
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try {
      const response = await fetch(env.TEST_BASE_URL);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      /* Server startup */
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  if (!ready) throw new Error("Validation server did not start.");
  await run("node_modules/@playwright/test/cli.js", ["test"]);
}
main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Validation failed");
    process.exitCode = 1;
  })
  .finally(async () => {
    server?.kill();
    smtp.close();
    inbox.close();
    if (
      url.pathname === `/${databaseName}` &&
      /^exchangehub_validation_\d+$/.test(databaseName)
    ) {
      await db.$runCommandRaw({ dropDatabase: 1 });
      console.log("Isolated validation database removed.");
    }
    await db.$disconnect();
  });
