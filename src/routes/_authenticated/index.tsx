import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Banknote,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  ShieldCheck,
  Settings,
  Truck,
  ArrowUpRight,
  ChevronLeft,
} from "lucide-react";
import { getDashboardStats } from "@/lib/reports/dashboard.functions";
import { getCutoverStatus } from "@/lib/migration/cutover.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "الرئيسية — سلام لإدارة المبيعات" },
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

  const { data, isPending } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => fetchStats(),
  });

  const MENU_ITEMS = [
    { to: "/sales", label: "المبيعات", icon: ShoppingCart, color: "bg-blue-500", shadow: "shadow-blue-200" },
    { to: "/purchases", label: "المشتريات", icon: Truck, color: "bg-orange-500", shadow: "shadow-orange-200" },
    { to: "/inventory", label: "المخزون", icon: Package, color: "bg-emerald-500", shadow: "shadow-emerald-200" },
    { to: "/customers", label: "الزبائن", icon: Users, color: "bg-purple-500", shadow: "shadow-purple-200" },
    { to: "/reports", label: "التقارير", icon: TrendingUp, color: "bg-rose-500", shadow: "shadow-rose-200" },
    { to: "/audit", label: "التدقيق", icon: ShieldCheck, color: "bg-slate-700", shadow: "shadow-slate-200" },
    { to: "/settings", label: "الإعدادات", icon: Settings, color: "bg-gray-400", shadow: "shadow-gray-200" },
    { to: "/treasury", label: "الخزينة", icon: Banknote, color: "bg-amber-500", shadow: "shadow-amber-200" },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">الرئيسية</h1>
          <p className="text-xs text-muted-foreground mt-0.5">سلام لإدارة المبيعات</p>
        </div>
      </div>

      {/* KPI Cards Mini */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Card className="border-none bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <CardContent className="p-4">
            <div className="text-[10px] opacity-80 mb-1">مبيعات اليوم</div>
            <div className="text-lg font-black tabular-nums">
              {isPending ? <Skeleton className="h-6 w-16 bg-white/20" /> : money(data?.sales.today || 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-none bg-background shadow-sm">
          <CardContent className="p-4">
            <div className="text-[10px] text-muted-foreground mb-1">الخزينة</div>
            <div className="text-lg font-black tabular-nums text-emerald-600">
              {isPending ? <Skeleton className="h-6 w-16" /> : money(data?.balances.treasury || 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-background shadow-sm hidden md:block">
          <CardContent className="p-4">
            <div className="text-[10px] text-muted-foreground mb-1">مستحقات الزبائن</div>
            <div className="text-lg font-black tabular-nums text-blue-600">
              {isPending ? <Skeleton className="h-6 w-16" /> : money(data?.balances.receivables || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Navigation Grid */}
      <div>
        <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
          <div className="w-1 h-4 bg-primary rounded-full" />
          أقسام النظام
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {MENU_ITEMS.map((item) => (
            <Link 
              key={item.to} 
              to={item.to}
              className="group"
            >
              <Card className="border-none shadow-sm hover:shadow-md transition-all active:scale-95 overflow-hidden">
                <CardContent className="p-6 flex flex-col items-center justify-center gap-3">
                  <div className={`size-14 rounded-2xl ${item.color} ${item.shadow} shadow-lg flex items-center justify-center text-white transition-transform group-hover:scale-110`}>
                    <item.icon className="size-7" />
                  </div>
                  <span className="font-bold text-sm">{item.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-none shadow-sm bg-blue-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Users className="size-4" />
            </div>
            <div>
              <div className="text-[9px] text-muted-foreground">الزبائن</div>
              <div className="text-sm font-bold tabular-nums">{data?.balances.receivables || 0} ج.م</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-orange-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
              <Package className="size-4" />
            </div>
            <div>
              <div className="text-[9px] text-muted-foreground">المخزون</div>
              <div className="text-sm font-bold tabular-nums">{data?.inventory.lowStockCount || 0} نواقص</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
