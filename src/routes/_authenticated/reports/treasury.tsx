import { createFileRoute } from '@tanstack/react-router';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { getTreasuryReport } from '@/lib/reports/treasury.functions';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowDownLeft, ArrowUpRight, Banknote } from 'lucide-react';
import { formatCurrency } from "@/lib/utils";
import { ReportFilters } from "@/components/reports/report-filters";
import { useState } from "react";
import { subDays, format } from "date-fns";

export const Route = createFileRoute('/_authenticated/reports/treasury')({
  component: TreasuryReportPage,
});

function TreasuryReportPage() {
  const [filters, setFilters] = useState({
    from_date: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    to_date: format(new Date(), "yyyy-MM-dd"),
  });

  const fetchReport = useServerFn(getTreasuryReport);
  const { data, isPending } = useQuery({
    queryKey: ['treasury-report', filters],
    queryFn: () => fetchReport({ data: filters })
  });

  const handlePrint = () => {
    const params = new URLSearchParams(filters as any).toString();
    window.open(`/api/print/reports/treasury?${params}`, '_blank');
  };

  // Removed local money function

  return (
    <div className="space-y-6">
      <PageHeader title="تقرير الخزينة" description="حركة السيولة النقدية والمقبوضات والمدفوعات" />
      
      <ReportFilters 
        onFilter={setFilters} 
        onPrint={handlePrint}
        isLoading={isPending}
      />

      {isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-green-50/50 dark:bg-green-950/10 border-green-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-green-600">إجمالي المقبوضات</p>
                  <ArrowDownLeft className="size-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold mt-2">{formatCurrency(data?.stats.totalIn)}</p>
              </CardContent>
            </Card>
            <Card className="bg-red-50/50 dark:bg-red-950/10 border-red-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-red-600">إجمالي المدفوعات</p>
                  <ArrowUpRight className="size-4 text-red-600" />
                </div>
                <p className="text-2xl font-bold mt-2">{formatCurrency(data?.stats.totalOut)}</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-primary">صافي الحركة</p>
                  <Banknote className="size-4 text-primary" />
                </div>
                <p className="text-2xl font-bold mt-2">{formatCurrency(data?.closingBalance)}</p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <table className="w-full text-sm text-right">
                <thead><tr className="border-b"><th className="p-2">التاريخ</th><th className="p-2">النوع</th><th className="p-2">المصدر</th><th className="p-2 text-left">المبلغ</th></tr></thead>
                <tbody>
                  {data?.movements.map((m: any) => (
                    <tr key={m.id} className="border-b last:border-0">
                      <td className="p-2 text-xs">{m.transaction_date}</td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${m.direction === 'in' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {m.direction === 'in' ? 'قبض' : 'صرف'}
                        </span>
                      </td>
                      <td className="p-2 text-muted-foreground text-xs">{m.source_type}</td>
                      <td className={`p-2 text-left font-mono font-bold ${m.direction === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                        {m.direction === 'in' ? '+' : '-'}{formatCurrency(m.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
