import { createFileRoute } from '@tanstack/react-router';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { getSalesReport } from '@/lib/reports/sales.functions';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createFileRoute('/_authenticated/reports/sales')({
  component: SalesReportPage,
});

function SalesReportPage() {
  const fetchReport = useServerFn(getSalesReport);
  const { data, isPending } = useQuery({
    queryKey: ['sales-report'],
    queryFn: () => fetchReport({})
  });

  return (
    <div className="space-y-6">
      <PageHeader title="تقرير المبيعات" description="تفاصيل المبيعات الصادرة والآجلة والخصومات" />
      
      {isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="grid gap-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">الإجمالي</p><p className="text-2xl font-bold">{data?.stats.total.toFixed(2)}</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">العدد</p><p className="text-2xl font-bold">{data?.stats.count}</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">نقدي</p><p className="text-2xl font-bold text-green-600">{data?.stats.cash.toFixed(2)}</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">آجل</p><p className="text-2xl font-bold text-amber-600">{data?.stats.credit.toFixed(2)}</p></CardContent></Card>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-right p-2">التاريخ</th><th className="text-right p-2">الرقم</th><th className="text-right p-2">العميل</th><th className="text-left p-2">الإجمالي</th></tr></thead>
                <tbody>
                  {data?.sales.map((s: any) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="p-2">{s.transaction_date}</td>
                      <td className="p-2">{s.doc_number}</td>
                      <td className="p-2">{s.customers?.name || '-'}</td>
                      <td className="p-2 text-left">{Number(s.total).toFixed(2)}</td>
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
