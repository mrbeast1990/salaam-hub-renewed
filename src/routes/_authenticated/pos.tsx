import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useMemo } from "react";
import { POSProducts } from "@/components/sales/pos-products";
import { POSCart } from "@/components/sales/pos-cart";
import { POSCheckout } from "@/components/sales/pos-checkout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PartyForm } from "@/components/parties/party-form";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postSale } from "@/lib/sales/sales.functions";
import { useNavigate } from "@tanstack/react-router";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/pos")({
  head: () => ({
    meta: [{ title: "البيع السريع — سلام" }],
  }),
  component: POSPage,
});

function POSPage() {
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [idempotencyKey] = useState(() => uuidv4());
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleAddToCart = useCallback((product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  }, []);

  const handleUpdateQty = useCallback((id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, item.qty + delta);
          return { ...item, qty: newQty };
        }
        return item;
      })
    );
  }, []);

  const handleSetQty = useCallback((id: string, qty: number) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, qty } : item))
    );
  }, []);

  const handleRemoveFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty * item.sale_price, 0);
  }, [cart]);

  const saleMutation = useMutation({
    mutationFn: async (checkoutData: any) => {
      const payload = {
        customer_id: selectedCustomer?.id || null,
        customer_name: selectedCustomer?.name || null,
        transaction_date: checkoutData.transactionDate,
        discount: checkoutData.discount,
        tax: 0,
        paid: checkoutData.paid,
        payment_method: checkoutData.paymentMethod,
        notes: checkoutData.notes,
        idempotency_key: idempotencyKey,
        items: cart.map((item) => ({
          product_id: item.id,
          product_name: item.name,
          qty: item.qty,
          unit_price: item.sale_price,
          unit_cost: item.cost_price,
          line_discount: 0,
        })),
      };
      
      // Use useServerFn or call directly if imported from functions.ts
      // In TanStack Start, we usually call the exported function directly
      return postSale({ data: payload });
    },
    onSuccess: (saleId) => {
      toast.success("تم حفظ الفاتورة بنجاح");
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["pos-products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      
      // فتح الفاتورة للطباعة ثم العودة
      window.open(`/api/print/sale/${saleId}`, "_blank");
      navigate({ to: "/sales" });
    },
    onError: (error: any) => {
      toast.error(error.message || "فشل حفظ الفاتورة");
    },
  });

  const handleConfirmCheckout = (checkoutData: any) => {
    saleMutation.mutate(checkoutData);
  };

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16)-theme(spacing.12))] -m-4 overflow-hidden rtl">
      {/* Products Area */}
      <div className="flex-1 p-4 bg-background border-l overflow-hidden flex flex-col">
        <POSProducts onAdd={handleAddToCart} />
      </div>

      {/* Cart Area */}
      <div className="w-[400px] flex flex-col bg-muted/10">
        <POSCart
          items={cart}
          onUpdateQty={handleUpdateQty}
          onSetQty={handleSetQty}
          onRemove={handleRemoveFromCart}
          selectedCustomer={selectedCustomer}
          onSelectCustomer={setSelectedCustomer}
          onNewCustomer={() => setIsNewCustomerOpen(true)}
        />
        
        <div className="p-4 bg-background border-t">
          <Button 
            className="w-full h-14 text-xl font-black shadow-lg shadow-primary/20"
            disabled={cart.length === 0}
            onClick={() => setIsCheckoutOpen(true)}
          >
            دفع و اعتماد ({(cartTotal).toFixed(2)})
          </Button>
        </div>
      </div>

      {/* New Customer Dialog */}
      <Dialog open={isNewCustomerOpen} onOpenChange={setIsNewCustomerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة عميل جديد</DialogTitle>
          </DialogHeader>
          <PartyForm 
            type="customer" 
            onSuccess={(customer: any) => {
              setSelectedCustomer(customer);
              setIsNewCustomerOpen(false);
              queryClient.invalidateQueries({ queryKey: ["customers-pos"] });
            }} 
          />
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>إتمام عملية البيع</DialogTitle>
          </DialogHeader>
          <POSCheckout
            total={cartTotal}
            customer={selectedCustomer}
            isPending={saleMutation.isPending}
            onConfirm={handleConfirmCheckout}
            onCancel={() => setIsCheckoutOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
