import { Suspense } from "react";
import { OrderDetail } from "@/components/order-detail";
async function Content({ params }: { params: Promise<{ id: string }> }) {
  return <OrderDetail id={(await params).id} />;
}
export default function Page({ params }: PageProps<"/dashboard/orders/[id]">) {
  return (
    <Suspense>
      <Content params={params} />
    </Suspense>
  );
}
