import { Suspense } from "react";
import { getPublicData } from "@/lib/public-data";
import { Checkout } from "@/components/checkout";
async function Content() {
  return <Checkout data={await getPublicData()} />;
}
export default function Page() {
  return (
    <Suspense fallback={<div className="p-12 text-center">ExchangeHub</div>}>
      <Content />
    </Suspense>
  );
}
