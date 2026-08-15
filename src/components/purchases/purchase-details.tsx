import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPurchaseDetails, cancelPurchase } from "@/lib/purchases/purchases.functions";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, XCircle, Calendar, User, CreditCard, FileText } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PurchaseDetailsProps {
  purchaseId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function PurchaseDetails({ purchaseId, onClose, onUpdate }: PurchaseDetailsProps) {
  const queryClient = useQueryClient();
  const [isCancelAlertOpen, setIsCancelAlertOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const { data: purchase, isLoading, isError } = useQuery({
    queryKey: ["purchase-details", purchaseId],
    queryFn: () => getPurchaseDetails({ id: purchaseId }),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelPurchase({ id: purchaseId, reason: cancelReason }),
    onSuccess: () => {
      toast.success("تم إلغاء الفاتورة بنجاح");
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      onUpdate();
      setIsCancelAlertOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "فشل إلغاء الفاتورة");
    },
  });

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-muted-foreground" /></div>;
  if (isError || !purchase) return <div className="text-center p-10 text-destructive">فشل تحميل تفاصيل الفاتورة</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <FileText className="size-5 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">رقم الفاتورة</div>
            <div className="font-mono font-bold">{purchase.doc_number}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Calendar className="size-5 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">التاريخ</div>
            <div className="font-medium">
              {format(new Date(purchase.transaction_date), "PPP", { locale: ar })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <User className="size-5 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">المورد</div>
            <div className="font-medium">{purchase.supplier_name}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <CreditCard className="size-5 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">طريقة الدفع</div>
            <div className="font-medium">{purchase.payment_method === 'cash' ? 'نقدي' : purchase.payment_method === 'bank' ? 'بنكي' : 'آجل'}</div>
          </div>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>الصنف</TableHead>
              <TableHead className="text-center w-[100px]">الكمية</TableHead>
              <TableHead className="text-left w-[120px]">سعر الوحدة</TableHead>
              <TableHead className="text-left w-[120px]">الإجمالي</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchase.items?.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.product_name}</TableCell>
                <TableCell className="text-center tabular-nums">{item.qty}</TableCell>
                <TableCell className="text-left tabular-nums">{item.unit_price.toFixed(2)}</TableCell>
                <TableCell className="text-left tabular-nums font-bold">{(item.qty * item.unit_price).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-2">
          {purchase.notes && (
            <div>
              <Label className="text-muted-foreground text-xs">ملاحظات</Label>
              <p className="text-sm border p-2 rounded bg-muted/20">{purchase.notes}</p>
            </div>
          )}
          {purchase.status === 'cancelled' && (
            <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
              <div className="text-destructive font-bold text-sm mb-1">تم إلغاء هذه الفاتورة</div>
              <div className="text-xs">{purchase.cancellation_reason}</div>
            </div>
          )}
        </div>

        <div className="w-full md:w-72 space-y-2 p-4 bg-muted/30 rounded-lg">
          <div className="flex justify-between text-sm">
            <span>الإجمالي</span>
            <span className="font-mono">{purchase.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>الخصم</span>
            <span className="font-mono">-{purchase.discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
            <span>الصافي</span>
            <span className="font-mono text-primary">{purchase.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm pt-2">
            <span>المدفوع</span>
            <span className="font-mono text-green-600">{purchase.paid.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span>المتبقي</span>
            <span className="font-mono text-destructive">{(purchase.total - purchase.paid).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" onClick={() => window.open(`/api/print/purchase/${purchase.id}`, '_blank')}>
          <Printer className="size-4 ml-2" />
          طباعة
        </Button>
        {purchase.status === 'posted' && (
          <Button variant="destructive" onClick={() => setIsCancelAlertOpen(true)}>
            <XCircle className="size-4 ml-2" />
            إلغاء الفاتورة
          </Button>
        )}
      </div>

      <AlertDialog open={isCancelAlertOpen} onOpenChange={setIsCancelAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من إلغاء الفاتورة؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم عكس كامل الآثار المالية والمخزونية لهذه الفاتورة. هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="reason">سبب الإلغاء</Label>
            <Input 
              id="reason" 
              placeholder="مثال: خطأ في البيانات..." 
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>تراجع</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                if (!cancelReason) {
                  toast.error("يرجى ذكر سبب الإلغاء");
                  return;
                }
                cancelMutation.mutate();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? "جاري الإلغاء..." : "تأكيد الإلغاء"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
