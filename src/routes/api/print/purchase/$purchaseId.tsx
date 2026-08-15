import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, FileText, Calendar, User, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/print/purchase/$purchaseId")({
  component: PrintPurchasePage,
});

function PrintPurchasePage() {
  const { purchaseId } = Route.useParams();

  const { data: purchase, isLoading } = useQuery({
    queryKey: ["print-purchase", purchaseId],
    queryFn: async () => {
      const { data: purchase, error: purchaseError } = await supabase
        .from("purchases")
        .select("*, suppliers(*)")
        .eq("id", purchaseId)
        .single();

      if (purchaseError) throw purchaseError;

      const { data: items, error: itemsError } = await supabase
        .from("purchase_items")
        .select("*")
        .eq("purchase_id", purchaseId);

      if (itemsError) throw itemsError;

      return { ...purchase, items };
    },
  });

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;
  if (!purchase) return <div className="text-center p-20">الفاتورة غير موجودة</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white text-black rtl" dir="rtl">
      <div className="flex justify-between items-start border-b-2 pb-6 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">فاتورة شراء</h1>
          <div className="space-y-1 text-sm">
            <div className="flex gap-2">
              <span className="text-muted-foreground">رقم الفاتورة:</span>
              <span className="font-mono font-bold">{purchase.doc_number}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground">التاريخ:</span>
              <span>{format(new Date(purchase.transaction_date), "PPP", { locale: ar })}</span>
            </div>
          </div>
        </div>
        <div className="text-left">
          <div className="font-bold text-xl mb-1">سلام Hub</div>
          <div className="text-sm text-muted-foreground italic">نظام إدارة المبيعات والمخزون</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="space-y-2">
          <h3 className="font-bold border-b pb-1 text-sm text-muted-foreground uppercase">المورد</h3>
          <div className="font-bold text-lg">{purchase.supplier_name}</div>
          {purchase.suppliers?.phone && <div className="text-sm">{purchase.suppliers.phone}</div>}
          {purchase.suppliers?.address && <div className="text-sm">{purchase.suppliers.address}</div>}
        </div>
        <div className="space-y-2">
          <h3 className="font-bold border-b pb-1 text-sm text-muted-foreground uppercase">تفاصيل الدفع</h3>
          <div className="text-sm flex justify-between">
            <span>طريقة الدفع:</span>
            <span className="font-medium">{purchase.payment_method === 'cash' ? 'نقدي' : purchase.payment_method === 'bank' ? 'بنكي' : 'آجل'}</span>
          </div>
          <div className="text-sm flex justify-between">
            <span>حالة الفاتورة:</span>
            <span className="font-medium">{purchase.status === 'posted' ? 'معتمدة' : 'ملغاة'}</span>
          </div>
        </div>
      </div>

      <Table className="mb-8 border">
        <TableHeader className="bg-muted/20">
          <TableRow>
            <TableHead className="text-right">الصنف</TableHead>
            <TableHead className="text-center">الكمية</TableHead>
            <TableHead className="text-left">السعر</TableHead>
            <TableHead className="text-left font-bold">الإجمالي</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchase.items?.map((item: any) => (
            <TableRow key={item.id} className="border-b">
              <TableCell className="font-medium">{item.product_name}</TableCell>
              <TableCell className="text-center font-mono">{item.qty}</TableCell>
              <TableCell className="text-left font-mono">{item.unit_price.toFixed(2)}</TableCell>
              <TableCell className="text-left font-mono font-bold">{(item.qty * item.unit_price).toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-end mb-12">
        <div className="w-64 space-y-2 border p-4 rounded-lg bg-muted/5">
          <div className="flex justify-between text-sm">
            <span>إجمالي البنود</span>
            <span className="font-mono">{purchase.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>الخصم</span>
            <span className="font-mono">-{purchase.discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold border-t pt-2 mt-2">
            <span>الصافي</span>
            <span className="font-mono text-primary">{purchase.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm pt-2 text-green-700 font-medium">
            <span>المدفوع</span>
            <span className="font-mono">{purchase.paid.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-destructive font-medium">
            <span>المتبقي</span>
            <span className="font-mono">{(purchase.total - purchase.paid).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {purchase.notes && (
        <div className="mb-8 p-4 border rounded bg-muted/5 text-sm">
          <div className="font-bold mb-1">ملاحظات:</div>
          <p>{purchase.notes}</p>
        </div>
      )}

      <div className="text-center text-xs text-muted-foreground border-t pt-8 print:hidden flex justify-center gap-4">
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="size-4" />
          طباعة الآن
        </Button>
        <Button variant="outline" onClick={() => window.close()}>
          إغلاق الصفحة
        </Button>
      </div>

      <div className="hidden print:block text-center text-[10px] text-muted-foreground mt-20">
        تمت الطباعة بواسطة نظام سلام Hub بتاريخ {format(new Date(), "yyyy-MM-dd HH:mm")}
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { padding: 0; margin: 0; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
        }
      `}} />
    </div>
  );
}
