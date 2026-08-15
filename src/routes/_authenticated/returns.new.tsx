import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getSaleDetails } from "@/lib/sales/sales.functions";
import { getPurchaseDetails } from "@/lib/purchases/purchases.functions";
import { Loader2, ArrowRight, ShoppingCart, AlertCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useMemo } from "react";
import { postSaleReturn, postPurchaseReturn } from "@/lib/returns/returns.functions";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/returns/new")({
  validateSearch: (search: Record<string, unknown>) => ({
    type: (search.type as "sale" | "purchase") || "sale",
    id: (search.id as string) || "",
  }),
  head: () => ({
    meta: [{ title: "مرتجع جديد — سلام" }],
  }),
  component: NewReturnPage,
});

function NewReturnPage() {
  const { type, id } = Route.useSearch();
  const [returnQtys, setReturnQtys] = useState<Record<string, number>>({});
  const [refundAmount, setRefundAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idempotencyKey] = useState(uuidv4());

  const { data: doc, isPending, isError } = useQuery({
    queryKey: ["doc-for-return", type, id],
    queryFn: () => type === "sale" ? getSaleDetails({ data: { id } }) : getPurchaseDetails({ data: { id } }),
    enabled: !!id,
  });

  const items = (doc as any)?.items || [];

  const totalReturnAmount = useMemo(() => {
    return items.reduce((sum: number, item: any) => {
      const qty = returnQtys[item.id] || 0;
      return sum + (qty * item.unit_price);
    }, 0);
  }, [items, returnQtys]);

  const handleQtyChange = (itemId: string, maxQty: number, val: string) => {
    const qty = Math.min(maxQty, Math.max(0, Number(val) || 0));
    setReturnQtys(prev => ({ ...prev, [itemId]: qty }));
  };

  const handleSubmit = async () => {
    const returnItems = items
      .filter((item: any) => (returnQtys[item.id] || 0) > 0)
      .map((item: any) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        qty: returnQtys[item.id],
        unit_price: item.unit_price,
      }));

    if (returnItems.length === 0) {
      toast.error("يجب اختيار صنف واحد على الأقل للمرتجع");
      return;
    }

    setIsSubmitting(true);
    try {
      if (type === "sale") {
        await postSaleReturn({
          data: {
            sale_id: id,
            customer_id: doc.customer_id,
            transaction_date: new Date().toISOString().split("T")[0],
            notes,
            idempotency_key: idempotencyKey,
            items: returnItems,
            refund_amount: refundAmount,
            payment_method: refundAmount > 0 ? "نقدي" : null,
          }
        });
      } else {
        await postPurchaseReturn({
          data: {
            purchase_id: id,
            supplier_id: doc.supplier_id,
            transaction_date: new Date().toISOString().split("T")[0],
            notes,
            idempotency_key: idempotencyKey,
            items: returnItems,
            refund_amount: refundAmount,
            payment_method: refundAmount > 0 ? "نقدي" : null,
          }
        });
      }
      toast.success("تم تسجيل المرتجع بنجاح");
      window.history.back();
    } catch (err: any) {
      toast.error(err.message || "فشل تسجيل المرتجع");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!id) return <div className="p-10 text-center">عذراً، يجب اختيار فاتورة للمرتجع</div>;
  if (isPending) return <Loader2 className="animate-spin mx-auto my-20" />;
  if (isError) return <div className="text-destructive p-10 text-center">فشل تحميل الفاتورة</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ArrowRight className="size-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">إنشاء مرتجع {type === "sale" ? "مبيعات" : "مشتريات"}</h2>
          <p className="text-sm text-muted-foreground">مرتبط بالفاتورة رقم: {doc.doc_number}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="bg-muted/50">
              <CardTitle className="text-sm">الأصناف القابلة للمرتجع</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الصنف</TableHead>
                    <TableHead className="text-center">الكمية المباعة</TableHead>
                    <TableHead className="text-center w-[120px]">كمية المرتجع</TableHead>
                    <TableHead className="text-left">السعر</TableHead>
                    <TableHead className="text-left">الإجمالي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell className="text-center">{item.qty}</TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          className="text-center h-8"
                          min={0}
                          max={item.qty}
                          value={returnQtys[item.id] || 0}
                          onChange={(e) => handleQtyChange(item.id, item.qty, e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="text-left">{item.unit_price.toFixed(2)}</TableCell>
                      <TableCell className="text-left font-bold">
                        {((returnQtys[item.id] || 0) * item.unit_price).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">ملاحظات المرتجع</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full min-h-[100px] p-3 rounded-md border text-sm"
                placeholder="سبب المرتجع أو أي ملاحظات أخرى..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-4">
            <CardHeader className="bg-primary text-primary-foreground">
              <CardTitle className="text-lg">ملخص المرتجع</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span>إجمالي قيمة المرتجع</span>
                <span className="font-bold text-lg">{totalReturnAmount.toFixed(2)}</span>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold">المبلغ المسترد نقداً</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Math.min(totalReturnAmount, Number(e.target.value) || 0))}
                />
                <p className="text-[10px] text-muted-foreground">
                  إذا تركت هذا الحقل 0، سيتم خصم القيمة من رصيد {type === "sale" ? "العميل" : "المورد"} فقط.
                </p>
              </div>

              <div className="bg-yellow-50 p-3 rounded border border-yellow-100 flex gap-2">
                <AlertCircle className="size-4 text-yellow-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-yellow-700">
                  عند الاعتماد، سيتم زيادة المخزون تلقائياً وتحديث حساب الطرف والخزينة.
                </p>
              </div>

              <Button 
                className="w-full h-12 text-lg font-bold" 
                onClick={handleSubmit}
                disabled={isSubmitting || totalReturnAmount === 0}
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Save className="ml-2" />}
                اعتماد المرتجع
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
