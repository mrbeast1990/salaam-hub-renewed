import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { History, ShoppingCart, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PurchaseForm } from "@/components/purchases/purchase-form";

export const Route = createFileRoute("/_authenticated/purchases/new")({
  head: () => ({
    meta: [{ title: "شراء جديد — سلام" }],
  }),
  component: NewPurchasePage,
});

function NewPurchasePage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/" })}>
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="text-xl font-bold">المشتريات</h1>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" asChild size="sm">
            <Link to="/purchases/new" className="gap-2">
              <ShoppingCart className="size-4" /> فاتورة شراء
            </Link>
          </Button>
          <Button variant="ghost" asChild size="sm">
            <Link to="/purchases" className="gap-2">
              <History className="size-4" /> سجل المشتريات
            </Link>
          </Button>
        </div>
      </div>

      <PurchaseForm onSuccess={() => navigate({ to: "/purchases" })} />
    </div>
  );
}
