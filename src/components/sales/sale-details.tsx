import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, 
  Printer, 
  XCircle, 
  User, 
  Calendar, 
  Hash, 
  CreditCard,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

interface SaleDetailsProps {
  saleId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function SaleDetails({ saleId, onClose, onUpdate }: SaleDetailsProps) {
  const queryClient = useQueryClient();
  const [cancelReason, setCancelReason] = useState("");

  const { data: sale, isPending, isError } = useQuery({
    queryKey: ["sale-details", saleId],
    queryFn: async () => {
      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .select("*, customers(*)")
        .eq("id", saleId)
        .single();

      if (saleError) throw saleError;

      const { data: items, error: itemsError } = await supabase
        .from("sale_items")
        .select("*")
        .eq("sale_id", saleId);

      if (itemsError) throw itemsError;

      return { ...saleData, items };
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("cancel_document", {
        entity_id: saleId,
        entity_type: "sale",
        reason: cancelReason,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم إلغاء الفاتورة بنجاح");
      queryClient.invalidateQueries({ queryKey: ["sale-details", saleId] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      onUpdate();
    },
    onError: (error: any) => {
      toast.error(error.message || "فشل إلغاء الفاتورة");
    },
  });

  if (isPending) return (
    <div className="flex justify-center py-20">
      <Loader2 className="size-10 animate-spin text-muted-foreground" />
    </div>
  );

  if (isError || !sale) return (
    <div className="text-center py-20 text-destructive">
      خطأ في تحميل بيانات الفاتورة
    </div>
  );

  const isCancelled = sale.status === "cancelled";
  const canCancel = sale.status === "posted";

  return (
    <div className="space-y-6 py-4">
      {/* Header Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/30 p-4 rounded-lg border border-muted">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Hash className="size-3" /> رقم الفاتورة
          </div>
          <div className="font-mono font-bold text-sm">{sale.doc_number}</div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="size-3" /> التاريخ
          </div>
          <div className="text-sm">
            {format(new Date(sale.transaction_date), "dd MMMM yyyy", { locale: ar })}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <User className="size-3" /> العميل
          </div>
          <div className="text-sm font-medium">{sale.customer_name || "عميل نقدي"}</div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <CreditCard className="size-3" /> طريقة الدفع
          </div>
          <div className="text-sm">{sale.payment_method || "—"}</div>
        </div>
      </div>

      {/* Items Table */}
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>الصنف</TableHead>
              <TableHead className="text-center w-[80px]">الكمية</TableHead>
              <TableHead className="text-left w-[100px]">السعر</TableHead>
              <TableHead className="text-left w-[120px]">الإجمالي</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sale.items?.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.product_name}</TableCell>
                <TableCell className="text-center tabular-nums">{item.qty}</TableCell>
                <TableCell className="text-left tabular-nums">{item.unit_price.toFixed(2)}</TableCell>
                <TableCell className="text-left font-bold tabular-nums">{item.line_total.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Totals & Notes */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          {sale.notes && (
            <div className="space-y-1.5 p-3 bg-blue-50/50 rounded-md border border-blue-100">
              <div className="text-xs font-bold text-blue-700 flex items-center gap-1">
                <FileText className="size-3" /> ملاحظات
              </div>
              <p className="text-sm text-blue-900">{sale.notes}</p>
            </div>
          )}
          {isCancelled && (
            <div className="space-y-1.5 p-3 bg-red-50 rounded-md border border-red-100">
              <div className="text-xs font-bold text-red-700 flex items-center gap-1">
                <XCircle className="size-3" /> سبب الإلغاء
              </div>
              <p className="text-sm text-red-900">{sale.cancellation_reason || "لا يوجد سبب مذكور"}</p>
              <div className="text-[10px] text-red-600 mt-1">
                بواسطة: {sale.cancelled_by} | {format(new Date(sale.cancelled_at!), "yyyy-MM-dd HH:mm", { locale: ar })}
              </div>
            </div>
          )}
        </div>

        <div className="bg-muted/20 p-4 rounded-lg space-y-2 border border-muted text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>المجموع الفرعي</span>
            <span className="tabular-nums">{sale.subtotal.toFixed(2)}</span>
          </div>
          {sale.discount > 0 && (
            <div className="flex justify-between text-destructive">
              <span>إجمالي الخصم (-)</span>
              <span className="tabular-nums">{sale.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-2 border-t border-muted-foreground/20">
            <span>الإجمالي النهائي</span>
            <span className="tabular-nums">{sale.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-green-700 font-medium pt-1">
            <span>المدفوع</span>
            <span className="tabular-nums">{sale.paid.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground pt-1">
            <span>المتبقي</span>
            <span className="tabular-nums">{(sale.total - sale.paid).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open(`/api/print/sale/${saleId}`, '_blank')}>
            <Printer className="size-4 ml-2" />
            طباعة الفاتورة
          </Button>
          
          {canCancel && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <XCircle className="size-4 ml-2" />
                  إلغاء الفاتورة
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>هل أنت متأكد من إلغاء الفاتورة؟</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-4 pt-2">
                    <p>سيتم إلغاء أثر الفاتورة بالكامل من المخزون وحساب العميل والخزينة عبر حركات عكسية موثقة. لا يمكن التراجع عن هذه العملية.</p>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-foreground">سبب الإلغاء:</label>
                      <Textarea 
                        placeholder="اكتب سبب الإلغاء هنا..." 
                        className="text-sm h-20"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                      />
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-row-reverse gap-2">
                  <AlertDialogAction 
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending || !cancelReason.trim()}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    {cancelMutation.isPending ? "جاري الإلغاء..." : "تأكيد الإلغاء"}
                  </AlertDialogAction>
                  <AlertDialogCancel>تراجع</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        
        <Button variant="ghost" onClick={onClose}>إغلاق</Button>
      </div>
    </div>
  );
}
