import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Printer, Eye } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { getPayments } from "@/lib/payments/payments.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PaymentForm } from "@/components/payments/payment-form";

export const Route = createFileRoute("/_authenticated/payments")({
  head: () => ({
    meta: [{ title: "السدادات — سلام" }],
  }),
  component: PaymentsPage,
});

function PaymentsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const { data: payments, isPending, refetch } = useQuery({
    queryKey: ["payments"],
    queryFn: () => getPayments({}),
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="سجل السدادات"
        action={
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="size-4 ml-2" />
            تسجيل سداد جديد
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم السند</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>الطرف</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead className="text-left">المبلغ</TableHead>
                <TableHead className="text-center">الحالة</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <Loader2 className="size-8 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : payments?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    لا توجد سدادات مسجلة.
                  </TableCell>
                </TableRow>
              ) : (
                payments?.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono">{p.doc_number}</TableCell>
                    <TableCell>{format(new Date(p.transaction_date), "yyyy-MM-dd")}</TableCell>
                    <TableCell>{p.party_name || "—"}</TableCell>
                    <TableCell>
                      {p.party_type === 'customer' ? 'تحصيل من عميل' : 'سداد لمورد'}
                    </TableCell>
                    <TableCell className="text-left font-bold">
                      {p.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={p.status === 'cancelled' ? 'destructive' : 'default'}>
                        {p.status === 'posted' ? 'معتمد' : p.status === 'cancelled' ? 'ملغى' : 'مسودة'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => window.open(`/api/print/payment/${p.id}`, '_blank')}>
                          <Printer className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تسجيل سداد جديد</DialogTitle>
          </DialogHeader>
          <PaymentForm onSuccess={() => { setIsFormOpen(false); refetch(); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
