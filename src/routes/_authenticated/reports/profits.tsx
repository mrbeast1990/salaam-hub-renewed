import { createFileRoute } from '@tanstack/react-router';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { getProfitReport } from '@/lib/reports/sales.functions';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, ArrowDown, ArrowUp, Banknote } from 'lucide-react';
import { formatCurrency } from "@/lib/utils";
import { ReportFilters } from "@/components/reports/report-filters";
import { useState } from "react";
import { subDays, format } from "date-fns";

export const Route = createFileRoute('/_authenticated/reports/profits')({
  component: ProfitReportPage,
});

function ProfitReportPage() {
  const [filters, setFilters] = useState<{ from_date?: string; to_date?: string }>({
    from_date: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    to_date: format(new Date(), "yyyy-MM-dd"),
  });
  
  const fetchReport = useServerFn(getProfitReport);
  const { data, isPending } = useQuery({
    queryKey: ['profit-report', filters],
    queryFn: () => fetchReport({ data: filters })
  });

  const handlePrint = () => {
    const params = new URLSearchParams(filters as any).toString();
    window.open(`/api/print/reports/profits?${params}`, '_blank');
  };

  // Removed local money function to use global formatCurrency

  return (
    <div className="space-y-6">
      <PageHeader title="تقرير الأرباح" description="تحليل الإيرادات والتكاليف وصافي الربح" />
      
      <ReportFilters 
        onFilter={setFilters} 
        onPrint={handlePrint}
        isLoading={isPending}
      />

      {isPending ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-blue-50/50 dark:bg-blue-950/10 border-blue-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-blue-600">الإيرادات</p>
                  <TrendingUp className="size-4 text-blue-600" />
                </div>
                <p className="text-2xl font-bold mt-2">{formatCurrency(data?.revenue)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">إجمالي المبيعات المعتمدة</p>
              </CardContent>
            </Card>

            <Card className="bg-orange-50/50 dark:bg-orange-950/10 border-orange-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-orange-600">تكلفة المبيعات</p>
                  <ArrowDown className="size-4 text-orange-600" />
                </div>
                <p className="text-2xl font-bold mt-2">{formatCurrency(data?.cogs)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">تكلفة البضاعة المباعة فعلياً</p>
              </CardContent>
            </Card>

            <Card className="bg-red-50/50 dark:bg-red-950/10 border-red-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-red-600">المصروفات</p>
                  <ArrowUp className="size-4 text-red-600" />
                </div>
                <p className="text-2xl font-bold mt-2">{formatCurrency(data?.expenses)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">إجمالي المصروفات الإدارية</p>
              </CardContent>
            </Card>

            <Card className="bg-green-50/50 dark:bg-green-950/10 border-green-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-green-600">صافي الربح</p>
                  <Banknote className="size-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold mt-2">{formatCurrency(data?.netProfit)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">النتيجة النهائية بعد التكاليف</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">تفاصيل المعادلة</h3>
                <div className="divide-y text-sm">
                  <div className="flex justify-between py-2"><span>إجمالي الإيرادات (المبيعات)</span><span>{formatCurrency(data?.revenue)}</span></div>
                  <div className="flex justify-between py-2 text-red-600"><span>(-) تكلفة البضاعة المباعة (COGS)</span><span>{formatCurrency(data?.cogs)}</span></div>
                  <div className="flex justify-between py-2 font-bold border-t"><span>(=) مجمل الربح (Gross Profit)</span><span>{formatCurrency(data?.grossProfit)}</span></div>
                  <div className="flex justify-between py-2 text-red-600"><span>(-) المصروفات التشغيلية</span><span>{formatCurrency(data?.expenses)}</span></div>
                  <div className="flex justify-between py-2 font-bold border-t text-lg"><span>(=) صافي الربح (Net Profit)</span><span className={data?.netProfit! >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(data?.netProfit)}</span></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
