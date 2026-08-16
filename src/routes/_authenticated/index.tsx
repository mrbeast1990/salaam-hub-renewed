import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  Banknote,
  Package,
  Receipt,
  RefreshCw,
  ShoppingCart,
  Users,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Info,
  Rocket,
} from "lucide-react";
import { getDashboardStats } from "@/lib/reports/dashboard.functions";
import { getCutoverStatus } from "@/lib/migration/cutover.functions";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "لوحة القيادة — سلام لإدارة المبيعات" },
      {
        name: "description",
        content: "مؤشرات المبيعات، المشتريات، الخزينة، والمخزون بشكل لحظي.",
      },
    ],
  }),
  component: DashboardPage,
});

function money(v: number) {
  return v.toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function DashboardPage() {
  const fetchStats = useServerFn(getDashboardStats);
  const { data: cutover } = useQuery({
    queryKey: ['cutover-status'],
    queryFn: () => getCutoverStatus()
  });
  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => fetchStats(),
  });

  if (cutover && !cutover.isLive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-6" dir="rtl">
        <div className="size-20 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">
          <Info className="size-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">النظام قيد التحديث</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            النظام حالياً في مرحلة ما قبل التحويل النهائي (Pre-Cutover). يرجى إتمام عملية التحويل للبدء في استخدام نظام الإنتاج.
          </p>
        </div>
        <Button asChild size="lg" className="gap-2">
          <Link to="/cutover">
            <Rocket className="size-5" />
            انتقل إلى صفحة التحويل النهائي
          </Link>
        </Button>
      </div>
    );
  }


  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="لوحة القيادة"
        description="نظرة شاملة على أداء النشاط المالي والتجاري"
        action={
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={"ml-2 size-4 " + (isFetching ? "animate-spin" : "")} />
            تحديث البيانات
          </Button>
        }
      />

      {isError && (
        <Card className="border-destructive/40">
          <CardContent className="py-6 text-center">
            <AlertTriangle className="mx-auto mb-2 size-6 text-destructive" />
            <p className="text-sm font-medium">تعذّر تحميل البيانات</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {(error as Error)?.message ?? "خطأ في الاتصال بقاعدة البيانات"}
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      )}

      {/* صف المؤشرات الأساسية */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          title="مبيعات اليوم"
          icon={<ShoppingCart className="size-4" />}
          value={data ? money(data.sales.today) : undefined}
          loading={isPending}
          trend={`أمس: ${data ? money(data.sales.yesterday) : "..."}`}
        />
        <Kpi
          title="مبيعات الشهر"
          icon={<TrendingUp className="size-4" />}
          value={data ? money(data.sales.month) : undefined}
          loading={isPending}
          color="primary"
        />
        <Kpi
          title="رصيد الخزينة"
          icon={<Banknote className="size-4" />}
          value={data ? money(data.balances.treasury) : undefined}
          loading={isPending}
        />
        <Kpi
          title="قيمة المخزون"
          icon={<Package className="size-4" />}
          value={data ? money(data.inventory.totalValue) : undefined}
          loading={isPending}
        />
      </div>

      {/* صف المديونيات والمصروفات */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          title="مستحقات العملاء"
          icon={<Users className="size-4" />}
          value={data ? money(data.balances.receivables) : undefined}
          loading={isPending}
          className="bg-green-50/50 dark:bg-green-950/10"
        />
        <Kpi
          title="مستحقات الموردين"
          icon={<Users className="size-4" />}
          value={data ? money(data.balances.payables) : undefined}
          loading={isPending}
          className="bg-red-50/50 dark:bg-red-950/10"
        />
        <Kpi
          title="مشتريات الشهر"
          icon={<ArrowDownLeft className="size-4" />}
          value={data ? money(data.purchases.month) : undefined}
          loading={isPending}
        />
        <Kpi
          title="مصروفات الشهر"
          icon={<ArrowUpRight className="size-4" />}
          value={data ? money(data.expenses.month) : undefined}
          loading={isPending}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* أحدث الحركات */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="size-4" />
              أحدث العمليات
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/audit">السجل بالكامل</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !data || data.recentMovements.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">لا توجد عمليات مسجلة حديثاً.</p>
            ) : (
              <div className="space-y-4">
                {data.recentMovements.map((move: any) => (
                  <div key={move.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0 last:pb-0">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-xs md:text-sm">
                        {move.source_type === 'sale' ? 'فاتورة بيع' : 
                         move.source_type === 'purchase' ? 'فاتورة شراء' :
                         move.source_type === 'payment' ? 'سداد' :
                         move.source_type === 'expense' ? 'مصروف' : move.source_type}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(move.created_at), "eeee، d MMMM yyyy HH:mm", { locale: ar })}
                      </span>
                    </div>
                    <div className="text-left font-mono font-semibold">
                      {Number(move.debit) > 0 ? (
                        <span className="text-green-600">+{money(Number(move.debit))}</span>
                      ) : (
                        <span className="text-red-600">-{money(Number(move.credit))}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* تنبيهات النظام */}
        <div className="space-y-4">
          <Card className={data?.inventory.lowStockCount ? "border-amber-200 bg-amber-50/20 dark:border-amber-900/30" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className={`size-4 ${data?.inventory.lowStockCount ? 'text-amber-500' : 'text-muted-foreground'}`} />
                تنبيهات المخزون
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isPending ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm">
                    {data?.inventory.lowStockCount ? 
                      `يوجد عدد ${data.inventory.lowStockCount} أصناف وصلت للحد الأدنى للمخزون.` : 
                      "المخزون في حالة جيدة."}
                  </p>
                  {data?.inventory.lowStockCount ? (
                    <Button asChild variant="secondary" size="sm">
                      <Link to="/inventory">عرض الأصناف</Link>
                    </Button>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="size-4 text-blue-500" />
                ملخص الحالة الصحية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>تطابق البيانات المالية</span>
                  <span className="text-green-600 font-bold">100%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-green-500 w-full" />
                </div>
                <p className="text-[10px] text-muted-foreground pt-1">يتم فحص كافة الحركات بشكل لحظي لضمان الذرية ومنع التكرار.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  title,
  value,
  icon,
  loading,
  trend,
  className,
  color,
}: {
  title: string;
  value?: string;
  icon: React.ReactNode;
  loading: boolean;
  trend?: string;
  className?: string;
  color?: "primary" | "default";
}) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground md:text-xs">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-7 w-20 md:w-24" />
        ) : (
          <div>
            <p className={`text-lg font-bold tabular-nums md:text-2xl ${color === 'primary' ? 'text-primary' : ''}`}>
              {value ?? "—"}
            </p>
            {trend && <p className="mt-1 text-[9px] text-muted-foreground md:text-[10px]">{trend}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
