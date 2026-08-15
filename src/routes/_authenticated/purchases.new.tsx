import { createFileRoute } from "@tanstack/react-router";
import { PurchaseForm } from "@/components/purchases/purchase-form";

export const Route = createFileRoute("/_authenticated/purchases/new")({
  head: () => ({
    meta: [{ title: "فاتورة شراء جديدة — سلام" }],
  }),
  component: NewPurchasePage,
});

function NewPurchasePage() {
  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <PurchaseForm />
    </div>
  );
}
