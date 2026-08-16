import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useServerFn } from "@tanstack/react-start";
import { getTreasuryReport } from "@/lib/reports/treasury.functions";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownLeft, ArrowUpRight, Banknote, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/treasury")({
  head: () => ({
    meta: [
      { title: "الخزينة — سلام لإدارة المبيعات" },
      { name: "description", content: "حركات النقد والبنك والمصروفات من دفتر الخزينة" },
      { property: "og:title", content: "الخزينة — سلام لإدارة المبيعات" },
      { property: "og:description", content: "حركات النقد والبنك والمصروفات من دفتر الخزينة" },
    ],
  }),
  component: TreasuryPage,
});

function TreasuryPage() {
  const fetchReport = useServerFn(getTreasuryReport);
  const { data, isPending } = useQuery({
    queryKey: ["treasury-report"],
    queryFn: () => fetchReport({}),
  });

  const money = (v: number = 0) => v.toLocaleString("ar-EG", { minimumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <PageHeader title="الخزينة" description="حركات النقد والبنك والمصروفات من دفتر الخزينة" />

      {isPending ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-green-50/50 dark:bg-green-950/10 border-green-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-green-600">إجمالي المقبوضات</p>
                  <ArrowDownLeft className="size-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold mt-2">{money(data?.stats.totalIn)}</p>
              </CardContent>
            </Card>
            <Card className="bg-red-50/50 dark:bg-red-950/10 border-red-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-red-600">إجمالي المدفوعات</p>
                  <ArrowUpRight className="size-4 text-red-600" />
                </div>
                <p className="text-2xl font-bold mt-2">{money(data?.stats.totalOut)}</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-primary">صافي الرصيد الحالي</p>
                  <Banknote className="size-4 text-primary" />
                </div>
                <p className="text-2xl font-bold mt-2">{money(data?.closingBalance)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>المصدر</TableHead>
                      <TableHead>الملاحظات</TableHead>
                      <TableHead className="text-left">المبلغ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.movements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          لا توجد حركات مسجلة في الخزينة.
                        </TableCell>
                      </TableRow>
                    ) : (
                      data?.movements.map((m: any) => (
                        <TableRow key={m.id}>
                          <TableCell className="text-xs">
                            {format(new Date(m.transaction_date), "yyyy-MM-dd")}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] ${
                                m.direction === "in" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                              }`}
                            >
                              {m.direction === "in" ? "قبض" : "صرف"}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {m.source_type === 'sale' ? 'فاتورة بيع' : 
                             m.source_type === 'purchase' ? 'فاتورة شراء' :
                             m.source_type === 'payment' ? 'سند سداد' :
                             m.source_type === 'expense' ? 'مصروف' : m.source_type}
                          </TableCell>
                          <TableCell className="text-xs truncate max-w-[200px]">{m.notes || "—"}</TableCell>
                          <TableCell
                            className={`p-2 text-left font-mono font-bold ${
                              m.direction === "in" ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {m.direction === "in" ? "+" : "-"}{money(Number(m.amount))}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
