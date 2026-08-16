import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboardStats } from "@/lib/reports/dashboard.functions";
import { AlertTriangle, Package, Users, Info, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "التنبيهات — سلام لإدارة المبيعات" },
      { name: "description", content: "نواقص المخزون، الصلاحيات المقاربة، الديون المتأخرة" },
      { property: "og:title", content: "التنبيهات — سلام لإدارة المبيعات" },
      { property: "og:description", content: "نواقص المخزون، الصلاحيات المقاربة، الديون المتأخرة" },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const fetchStats = useServerFn(getDashboardStats);
  const { data, isPending } = useQuery({
    queryKey: ["dashboard-stats-notifications"],
    queryFn: () => fetchStats(),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="التنبيهات" description="نواقص المخزون، والديون المستحقة، وتنبيهات النظام" />

      {isPending ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* تنبيهات المخزون */}
          {data?.inventory.lowStockCount ? (
            <Card className="border-amber-200 bg-amber-50/20 dark:border-amber-900/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="size-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                    <Package className="size-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-amber-900 dark:text-amber-400">نقص في المخزون</p>
                      <span className="text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">عاجل</span>
                    </div>
                    <p className="text-sm text-amber-800/80 dark:text-amber-500/80">
                      يوجد عدد {data.inventory.lowStockCount} أصناف وصلت أو تجاوزت الحد الأدنى للمخزون المسموح به.
                    </p>
                    <div className="pt-2">
                      <Link to="/inventory" className="text-xs font-bold text-amber-700 underline flex items-center gap-1">
                        عرض الأصناف المتأثرة
                        <ArrowRight className="size-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 flex flex-col items-center justify-center py-10 text-center space-y-2">
                <div className="size-12 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                  <Info className="size-6" />
                </div>
                <p className="font-medium text-muted-foreground">لا توجد تنبيهات مخزون حالياً</p>
              </CardContent>
            </Card>
          )}

          {/* تنبيهات الديون */}
          {data?.balances.receivables! > 10000 && (
            <Card className="border-blue-200 bg-blue-50/20 dark:border-blue-900/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <Users className="size-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-bold text-blue-900 dark:text-blue-400">تنبيه مستحقات العملاء</p>
                    <p className="text-sm text-blue-800/80 dark:text-blue-500/80">
                      إجمالي مديونية العملاء تجاوزت الحد المستهدف ({data?.balances.receivables.toLocaleString('ar-EG')} ريال).
                    </p>
                    <div className="pt-2">
                      <Link to="/customers" className="text-xs font-bold text-blue-700 underline flex items-center gap-1">
                        مراجعة أرصدة العملاء
                        <ArrowRight className="size-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
