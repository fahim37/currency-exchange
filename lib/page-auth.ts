import "server-only";
import { redirect } from "next/navigation";
import { requireUser, ApiError } from "./api";
export async function pageUser(next: string, admin = false) {
  try {
    return await requireUser(admin);
  } catch (e) {
    if (e instanceof ApiError && e.status === 403)
      redirect("/dashboard?error=forbidden");
    if (e instanceof ApiError && [401, 503].includes(e.status))
      redirect(`/login?next=${encodeURIComponent(next)}`);
    throw e;
  }
}
