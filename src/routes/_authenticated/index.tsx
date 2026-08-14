import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "لوحة القيادة — سلام لإدارة المبيعات" },
      {
        name: "description",
        content: "مؤشرات مبيعات اليوم والخزينة والفواتير وتنبيهات المخزون في مكان واحد.",
      },
      { property: "og:title", content: "لوحة القيادة — سلام لإدارة المبيعات" },
      {
        property: "og:description",
        content: "مؤشرات مبيعات اليوم والخزينة والفواتير وتنبيهات المخزون.",
      },
    ],
  }),
  component: DashboardPage,
});

type Dashboard = {
  todaySales: number;
  todayInvoices: number;
  treasury: number;
  receivables: number;
  lowStock: { id: string; name: string; stock: number; threshold: number }[];
};

async function loadDashboard(): Promise<Dashboard> {
  const today = new Date().toISOString().slice(0, 10);

  const [salesRes, treasuryRes, customersRes, stockRes, productsRes] = await Promise.all([
    supabase
      .from("sales")
      .select("total")
      .eq("status", "posted")
      .eq("transaction_date", today),
    supabase.from("v_treasury_balance").select("method, balance"),
    supabase.from("v_customer_balance").select("balance"),
    supabase.from("v_product_stock").select("product_id, stock"),
    supabase.from("products").select("id, name, low_stock_threshold").eq("active", true),
  ]);

  const firstError =
    salesRes.error || treasuryRes.error || customersRes.error || stockRes.error || productsRes.error;
  if (firstError) throw firstError;

  const stockMap = new Map(
    (stockRes.data ?? []).map((r) => [r.product_id as string, Number(r.stock ?? 0)]),
  );

  return {
    todaySales: (salesRes.data ?? []).reduce((s, r) => s + Number(r.total ?? 0), 0),
    todayInvoices: (salesRes.data ?? []).length,
    treasury: (treasuryRes.data ?? []).reduce((s, r) => s + Number(r.balance ?? 0), 0),
    receivables: (customersRes.data ?? []).reduce(
      (s, r) => s + Math.max(Number(r.balance ?? 0), 0),
      0,
    ),
    lowStock: (productsRes.data ?? [])
      .map((p) => ({
        id: p.id as string,
        name: p.name as string,
        stock: stockMap.get(p.id as string) ?? 0,
        threshold: Number(p.low_stock_threshold ?? 0),
      }))
      .filter((p) => p.stock <= p.threshold)
      .slice(0, 8),
  };
}

function money(v: number) {
  return v.toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function DashboardPage() {
  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["dashboard"],
    queryFn: loadDashboard,
  });

  return (
    <div>
      <PageHeader
        title="لوحة القيادة"
        description="نظرة سريعة على المبيعات والخزينة والمخزون"
        action={
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={"size-4 " + (isFetching ? "animate-spin" : "")} />
            تحديث
          </Button>
        }
      />

      {isError && (
        <Card className="mb-4 border-destructive/40">
          <CardContent className="py-6 text-center">
            <AlertTriangle className="mx-auto mb-2 size-6 text-destructive" />
            <p className="text-sm font-medium">تعذّر تحميل المؤشرات</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {(error as Error)?.message ?? "خطأ غير معروف"}
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          title="مبيعات اليوم"
          icon={<ShoppingCart className="size-4" />}
          value={data ? money(data.todaySales) : undefined}
          loading={isPending}
        />
        <Kpi
          title="فواتير اليوم"
          icon={<Receipt className="size-4" />}
          value={data ? String(data.todayInvoices) : undefined}
          loading={isPending}
        />
        <Kpi
          title="رصيد الخزينة"
          icon={<Banknote className="size-4" />}
          value={data ? money(data.treasury) : undefined}
          loading={isPending}
        />
        <Kpi
          title="ديون العملاء"
          icon={<Users className="size-4" />}
          value={data ? money(data.receivables) : undefined}
          loading={isPending}
        />
      </div>

      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="size-4" />
            تنبيهات المخزون
          </CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to="/inventory">المخزون</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : !data || data.lowStock.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              لا توجد أصناف تحت الحد الأدنى.
            </p>
          ) : (
            <ul className="divide-y">
              {data.lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <span>{p.name}</span>
                  <span className="text-muted-foreground">
                    المتاح {p.stock} / الحد {p.threshold}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({
  title,
  value,
  icon,
  loading,
}: {
  title: string;
  value?: string;
  icon: React.ReactNode;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-7 w-24" />
        ) : (
          <p className="text-xl font-bold tabular-nums md:text-2xl">{value ?? "—"}</p>
        )}
      </CardContent>
    </Card>
  );
}
