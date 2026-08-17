import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useServerFn } from "@tanstack/react-start";
import { getTreasuryReport } from "@/lib/reports/treasury.functions";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownLeft, ArrowUpRight, Banknote, Search, Calendar, Printer } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { useState } from "react";
import { ReportFilters } from "@/components/reports/report-filters";

export const Route = createFileRoute("/_authenticated/treasury")({
  head: () => ({
    meta: [
      { title: "الخزينة — سلام" },
    ],
  }),
  component: TreasuryPage,
});

function TreasuryPage() {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  });

  const fetchReport = useServerFn(getTreasuryReport);
  
  const { data, isPending } = useQuery({
    queryKey: ["treasury-report", dateRange.from?.toISOString(), dateRange.to?.toISOString()],
    queryFn: () => fetchReport({ 
      data: {
        from_date: dateRange.from?.toISOString().split('T')[0],
        to_date: dateRange.to?.toISOString().split('T')[0]
      }
    }),
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="حركة الخزينة" 
        description="سجل المقبوضات والمدفوعات النقدية والبنكية" 
      />

      <ReportFilters 
        onFilter={(range) => setDateRange({ from: range.from, to: range.to })} 
        onPrint={() => window.open(`/api/print/treasury?from=${dateRange.from?.toISOString().split('T')[0]}&to=${dateRange.to?.toISOString().split('T')[0]}`, '_blank')}
      />

      {isPending ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-none shadow-sm bg-green-50/50 dark:bg-green-950/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-green-600">إجمالي المقبوضات</p>
                  <div className="bg-green-100 p-2 rounded-full text-green-600">
                    <ArrowDownLeft className="size-4" />
                  </div>
                </div>
                <p className="text-2xl font-black mt-2 tabular-nums">{formatCurrency(data?.stats.totalIn || 0)}</p>
              </CardContent>
            </Card>
            
            <Card className="border-none shadow-sm bg-red-50/50 dark:bg-red-950/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-red-600">إجمالي المدفوعات</p>
                  <div className="bg-red-100 p-2 rounded-full text-red-600">
                    <ArrowUpRight className="size-4" />
                  </div>
                </div>
                <p className="text-2xl font-black mt-2 tabular-nums">{formatCurrency(data?.stats.totalOut || 0)}</p>
              </CardContent>
            </Card>
            
            <Card className="border-none shadow-sm bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-primary">الرصيد النهائي</p>
                  <div className="bg-primary/10 p-2 rounded-full text-primary">
                    <Banknote className="size-4" />
                  </div>
                </div>
                <p className="text-2xl font-black mt-2 tabular-nums">{formatCurrency(data?.closingBalance || 0)}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="size-4 text-primary" />
                تفاصيل الحركات للفترة المحددة
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[120px]">التاريخ</TableHead>
                      <TableHead className="w-[100px]">النوع</TableHead>
                      <TableHead>المصدر</TableHead>
                      <TableHead>البيان / الملاحظات</TableHead>
                      <TableHead className="text-left w-[150px]">المبلغ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.movements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                          لا توجد حركات مسجلة في هذه الفترة.
                        </TableCell>
                      </TableRow>
                    ) : (
                      data?.movements.map((m: any) => (
                        <TableRow key={m.id} className="group transition-colors">
                          <TableCell className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                            {format(new Date(m.transaction_date), "yyyy-MM-dd", { locale: ar })}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center justify-center w-12 py-1 rounded-md text-[10px] font-bold ${
                                m.direction === "in" 
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30" 
                                  : "bg-red-100 text-red-700 dark:bg-red-900/30"
                              }`}
                            >
                              {m.direction === "in" ? "قبض +" : "صرف -"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs font-semibold">
                              {m.source_type === 'sale' ? 'فاتورة بيع' : 
                               m.source_type === 'purchase' ? 'فاتورة شراء' :
                               m.source_type === 'payment' ? 'سند سداد' :
                               m.source_type === 'expense' ? 'مصروف' : m.source_type}
                            </div>
                            <div className="text-[10px] text-muted-foreground">{m.reference_number || "—"}</div>
                          </TableCell>
                          <TableCell className="text-xs max-w-[250px] truncate group-hover:whitespace-normal group-hover:overflow-visible group-hover:bg-muted/50 transition-all">
                            {m.notes || "—"}
                          </TableCell>
                          <TableCell
                            className={`text-left font-black tabular-nums ${
                              m.direction === "in" ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {formatCurrency(Number(m.amount))}
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
