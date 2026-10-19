import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const password = process.env.TEST_PASSWORD!;
test.skip(
  !password,
  "Run npm run validate:full to provision the isolated test environment.",
);
async function english(page: Page) {
  await page.addInitScript(() =>
    localStorage.setItem("exchangehub-locale", "en"),
  );
}
async function login(page: Page, email: string) {
  await english(page);
  await page.goto("/login");
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in to your account" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}
test("responsive bilingual themes, calculator, method dialog and accessibility", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "আপনার টাকা",
  );
  await page.getByRole("button", { name: "Switch to English" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Your money",
  );
  await page.getByLabel("Color theme").selectOption("dark");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Your money",
  );
  await page.getByLabel("You send", { exact: true }).fill("12500");
  await expect(page.locator("output")).toHaveText("100.00");
  await page.getByRole("button", { name: "Select receive method" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: /Tether/ }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "Select receive method" }).click();
  await page.keyboard.press("Escape");
  await mkdir("artifacts", { recursive: true });
  await page.screenshot({ path: "artifacts/home-dark.png", fullPage: true });
  await page.getByLabel("Color theme").selectOption("light");
  await page.screenshot({ path: "artifacts/home-light.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
  await page.screenshot({ path: "artifacts/home-mobile.png", fullPage: true });
  expect(errors).toEqual([]);
});
test("customer checkout, tracking, admin payout and authorization", async ({
  browser,
}) => {
  const customer = await browser.newContext(),
    admin = await browser.newContext(),
    other = await browser.newContext();
  const page = await customer.newPage();
  await login(page, "customer@example.test");
  await page.goto("/");
  await page.getByLabel("You send", { exact: true }).fill("12500");
  await page.getByRole("button", { name: "Start your exchange" }).click();
  await page.getByLabel("Payoneer email address").fill("receiver@example.test");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Confirm & lock my rate" }).click();
  await expect(
    page.getByText("Send to this account", { exact: false }),
  ).toBeVisible();
  await page.getByLabel("Your sending account / number").fill("01712345678");
  await page
    .getByLabel("Payment transaction ID (TrxID)")
    .fill("BROWSER-TRX-001");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Review exchange" }).click();
  await page.getByRole("button", { name: "Submit exchange" }).click();
  await expect(page).toHaveURL(/\/dashboard\/orders\/[a-f\d]{24}/);
  const orderId = page.url().split("/").pop()!;
  await expect(page.getByText("Pending", { exact: true })).toBeVisible();
  await expect((await customer.request.get("/api/admin/orders")).status()).toBe(
    403,
  );
  const otherPage = await other.newPage();
  await login(otherPage, "other@example.test");
  await expect(
    (await other.request.get(`/api/orders/${orderId}`)).status(),
  ).toBe(404);
  const adminPage = await admin.newPage();
  await login(adminPage, "admin@example.test");
  await adminPage.goto("/admin/orders");
  await adminPage.getByRole("button", { name: "Review", exact: true }).click();
  await adminPage.getByRole("checkbox").check();
  await adminPage
    .getByRole("button", { name: "Confirm & update order" })
    .click();
  await expect(
    adminPage.getByText("Processing", { exact: true }),
  ).toBeVisible();
  await adminPage.getByRole("button", { name: "Review", exact: true }).click();
  await adminPage
    .getByLabel("Payout reference (required to complete)")
    .fill("BROWSER-PAYOUT-001");
  await adminPage
    .getByRole("button", { name: "Confirm & update order" })
    .click();
  await expect(adminPage.getByText("Completed", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("BROWSER-PAYOUT-001")).toBeVisible();
  const publicBoard = await (await customer.request.get("/api/public")).json();
  expect(JSON.stringify(publicBoard.activity)).not.toContain(
    "customer@example.test",
  );
  expect(JSON.stringify(publicBoard.activity)).not.toContain("BROWSER-TRX-001");
  expect(
    (
      await customer.request.post("/api/quotes", {
        headers: { origin: "https://untrusted.example" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  await page.screenshot({
    path: "artifacts/customer-order.png",
    fullPage: true,
  });
  for (const route of [
    "/admin",
    "/admin/rates",
    "/admin/methods",
    "/admin/users",
    "/admin/settings",
    "/admin/audit",
  ]) {
    await adminPage.goto(route);
    await expect(adminPage.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(adminPage.locator("main [role=alert]")).toHaveCount(0);
  }
  for (const [route, label] of [
    ["/admin/methods", "Save configuration"],
    ["/admin/rates", "Save configuration"],
  ]) {
    await adminPage.goto(route);
    await adminPage
      .getByRole("button", { name: "Edit", exact: true })
      .first()
      .click();
    await adminPage.getByRole("button", { name: label, exact: true }).click();
    await expect(adminPage.getByRole("dialog")).not.toBeVisible();
  }
  await adminPage.goto("/admin/settings");
  await adminPage
    .getByRole("button", { name: "Save service settings" })
    .click();
  await expect(adminPage.getByText("Service settings saved")).toBeVisible();
  await adminPage.goto("/admin");
  await adminPage.screenshot({
    path: "artifacts/admin-overview.png",
    fullPage: true,
  });
  await page.goto("/dashboard/profile");
  await page.getByRole("button", { name: "Add account" }).click();
  const publicData = await (await customer.request.get("/api/public")).json();
  const method = publicData.methods.find(
    (m: { name: string }) => m.name === "Payoneer",
  );
  await page
    .getByLabel("Payment method", { exact: true })
    .selectOption(method.id);
  await page.getByLabel("Account nickname").fill("Everyday account");
  await page
    .getByLabel("Email / number / wallet address")
    .fill("saved@example.test");
  await page.getByRole("button", { name: "Save account", exact: true }).click();
  await expect(page.getByText("saved@example.test")).toBeVisible();
  await customer.close();
  await admin.close();
  await other.close();
});
test("signup verifies email and password reset works through SMTP", async ({
  page,
  request,
}) => {
  await english(page);
  await page.goto("/signup");
  const email = `signup-${Date.now()}@example.test`;
  await page.getByLabel("Your name", { exact: true }).fill("Signup Customer");
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Create your account", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Check your inbox" }),
  ).toBeVisible();
  async function mailUrl(fragment: string) {
    let url = "";
    await expect
      .poll(async () => {
        const mails = await (await request.get("http://127.0.0.1:3102")).json();
        const mail = mails
          .filter(
            (m: { to: string; text: string }) =>
              m.to.includes(email) && m.text.includes(fragment),
          )
          .pop();
        url = mail?.text.match(/http:\/\/[^\s]+/)?.[0] || "";
        return url;
      })
      .not.toBe("");
    return url;
  }
  await page.goto(await mailUrl("verify-email"));
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "A clearer picture." }),
  ).toBeVisible();
  await page.goto("/forgot-password");
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(
    page.getByRole("heading", { name: "Check your inbox" }),
  ).toBeVisible();
  await page.goto(await mailUrl("reset-password"));
  await page.getByLabel("Password", { exact: true }).fill(password + "New");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(
    page.getByRole("heading", { name: "Password updated" }),
  ).toBeVisible();
  await page.goto("/login");
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password + "New");
  await page.getByRole("button", { name: "Sign in to your account" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
});
