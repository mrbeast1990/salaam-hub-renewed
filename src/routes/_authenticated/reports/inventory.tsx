import { createFileRoute } from '@tanstack/react-router';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { getInventoryReport } from '@/lib/reports/inventory.functions';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatNumber } from "@/lib/utils";

export const Route = createFileRoute('/_authenticated/reports/inventory')({
  component: InventoryReportPage,
});

function InventoryReportPage() {
  const fetchReport = useServerFn(getInventoryReport);
  const { data, isPending } = useQuery({
    queryKey: ['inventory-report'],
    queryFn: () => fetchReport({})
  });

  return (
    <div className="space-y-6">
      <PageHeader title="تقرير المخزون" description="الكميات المتاحة وقيمة المستودع الفعلية" />
      
      {isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="grid gap-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">عدد الأصناف</p><p className="text-2xl font-bold">{formatNumber(data?.summary.totalItems)}</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">قيمة المخزون</p><p className="text-2xl font-bold text-primary">{formatCurrency(data?.summary.totalValue)}</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">نواقص</p><p className="text-2xl font-bold text-red-600">{formatNumber(data?.summary.lowStock)}</p></CardContent></Card>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <table className="w-full text-sm text-right">
                <thead><tr className="border-b"><th className="p-2">الصنف</th><th className="p-2">الكمية</th><th className="p-2">التكلفة</th><th className="p-2 text-left">القيمة</th></tr></thead>
                <tbody>
                  {data?.items.map((i: any) => (
                    <tr key={i.id} className={`border-b last:border-0 ${i.on_hand <= i.min_stock ? 'bg-red-50/50' : ''}`}>
                      <td className="p-2">{i.name}</td>
                      <td className="p-2">{formatNumber(i.on_hand)}</td>
                      <td className="p-2">{formatCurrency(i.cost_price)}</td>
                      <td className="p-2 text-left">{formatCurrency(i.on_hand * i.cost_price)}</td>
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
