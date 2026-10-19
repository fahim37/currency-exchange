import { Suspense } from "react";
import { pageUser } from "@/lib/page-auth";
import { WorkspaceShell } from "@/components/workspace-shell";
async function Protected({ children }: { children: React.ReactNode }) {
  const user = await pageUser("/dashboard");
  return (
    <WorkspaceShell
      user={{ name: user.name, email: user.email, role: user.role }}
    >
      {children}
    </WorkspaceShell>
  );
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-12 text-center">ExchangeHub</div>}>
      <Protected>{children}</Protected>
    </Suspense>
  );
}
