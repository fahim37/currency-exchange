import "./env";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { createInterface, emitKeypressEvents } from "node:readline";
import { stdin, stdout } from "node:process";
import { z } from "zod";
const db = new PrismaClient();
function ask(question: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });
  return new Promise((resolve) =>
    rl.question(question, (value) => {
      rl.close();
      resolve(value.trim());
    }),
  );
}
function hidden(question: string): Promise<string> {
  if (!stdin.isTTY)
    throw new Error(
      "Run admin:create in an interactive terminal. Passwords are never accepted in command arguments.",
    );
  stdout.write(question);
  emitKeypressEvents(stdin);
  stdin.setRawMode(true);
  stdin.resume();
  return new Promise((resolve, reject) => {
    let value = "";
    const onKey = (char: string, key: { name?: string; ctrl?: boolean }) => {
      if (key?.ctrl && key.name === "c") {
        cleanup();
        reject(new Error("Cancelled"));
      } else if (key?.name === "return") {
        cleanup();
        resolve(value);
      } else if (key?.name === "backspace") value = value.slice(0, -1);
      else if (char && !key?.ctrl && !/[\r\n\u001b]/.test(char)) value += char;
    };
    function cleanup() {
      stdin.off("keypress", onKey);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\n");
    }
    stdin.on("keypress", onKey);
  });
}
async function main() {
  const email = z
    .email()
    .parse((await ask("Administrator email: ")).toLowerCase());
  if (await db.user.findUnique({ where: { email } }))
    throw new Error(
      "That email already exists. This command does not promote or overwrite existing users.",
    );
  const name = z
    .string()
    .min(2)
    .max(60)
    .parse(await ask("Administrator name: "));
  const password = z
    .string()
    .min(12)
    .max(128)
    .parse(await hidden("Password (12+ characters, hidden): "));
  if (password !== (await hidden("Confirm password (hidden): ")))
    throw new Error("Passwords do not match.");
  const hash = await hashPassword(password);
  await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name, email, role: "ADMIN", emailVerified: true },
    });
    await tx.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: hash,
      },
    });
    await tx.auditEvent.create({
      data: {
        actorId: user.id,
        action: "ADMIN_CREATED_CLI",
        targetId: user.id,
        details: { source: "interactive-terminal" },
      },
    });
  });
  console.log("Administrator created. Sign in at /login, then open /admin.");
}
main()
  .catch((error) => {
    console.error(
      error instanceof z.ZodError
        ? "Check the email, name, and password length."
        : error instanceof Error
          ? error.message.replace(/mongodb[^\s]*/g, "[database connection]")
          : "Admin creation failed.",
    );
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
