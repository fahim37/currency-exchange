import { connection } from "next/server";
import { Suspense } from "react";
import { AuthScreen } from "@/components/auth-screen";
import { databaseConfigured } from "@/lib/config";
import { mailConfigured } from "@/lib/mail";
async function Content() {
  await connection();
  return (
    <AuthScreen
      mode="login"
      configured={databaseConfigured()}
      emailReady={mailConfigured()}
    />
  );
}
export default function Page() {
  return (
    <Suspense>
      <Content />
    </Suspense>
  );
}
