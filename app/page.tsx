import { Suspense } from "react";
import { Home } from "@/components/home";
import { getPublicData } from "@/lib/public-data";
async function Content() {
  return <Home initialData={await getPublicData()} />;
}
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-primary">
          ExchangeHub
        </div>
      }
    >
      <Content />
    </Suspense>
  );
}
