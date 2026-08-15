import { createFileRoute } from '@tanstack/react-router';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { getPurchasesReport } from '@/lib/reports/purchases.functions';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createFileRoute('/_authenticated/reports/purchases')({
  component: PurchasesReportPage,
});

function PurchasesReportPage() {
  const fetchReport = useServerFn(getPurchasesReport);
  const { data, isPending } = useQuery({
    queryKey: ['purchases-report'],
    queryFn: () => fetchReport({})
  });

  const money = (v: number = 0) => v.toLocaleString('ar-EG', { minimumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <PageHeader title="تقرير المشتريات" description="تحليل فواتير الشراء والتزامات الموردين" />
      
      {isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="grid gap-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">إجمالي المشتريات</p><p className="text-2xl font-bold">{money(data?.stats.total)}</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">عدد الفواتير</p><p className="text-2xl font-bold">{data?.stats.count}</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">المدفوع نقداً</p><p className="text-2xl font-bold text-green-600">{money(data?.stats.cash)}</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">المديونية للموردين</p><p className="text-2xl font-bold text-red-600">{money(data?.stats.credit)}</p></CardContent></Card>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <table className="w-full text-sm text-right">
                <thead><tr className="border-b"><th className="p-2">التاريخ</th><th className="p-2">الرقم</th><th className="p-2">المورد</th><th className="p-2 text-left">الإجمالي</th></tr></thead>
                <tbody>
                  {data?.purchases.map((p: any) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="p-2">{p.transaction_date}</td>
                      <td className="p-2">{p.doc_number}</td>
                      <td className="p-2">{p.suppliers?.name || '-'}</td>
                      <td className="p-2 text-left">{money(Number(p.total))}</td>
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
