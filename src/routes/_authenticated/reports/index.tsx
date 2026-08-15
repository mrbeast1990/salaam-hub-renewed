import { createFileRoute, Link } from '@tanstack/react-router';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { 
  BarChart3, 
  ShoppingCart, 
  TrendingUp, 
  Package, 
  Users, 
  Banknote,
  FileText,
  History,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';

export const Route = createFileRoute('/_authenticated/reports/')({
  component: ReportsHubPage,
});

const REPORT_SECTIONS = [
  {
    title: "المبيعات والأرباح",
    items: [
      { to: "/reports/sales", label: "تقرير المبيعات", icon: ShoppingCart, description: "تحليل المبيعات اليومية والشهرية والفلاتر" },
      { to: "/reports/profits", label: "تقرير الأرباح", icon: TrendingUp, description: "مجمل الربح وصافي الأرباح بعد المصروفات" },
    ]
  },
  {
    title: "المخزون والمشتريات",
    items: [
      { to: "/reports/inventory", label: "تقرير المخزون", icon: Package, description: "الكميات المتاحة، النواقص، وقيمة المستودع" },
      { to: "/reports/purchases", label: "تقرير المشتريات", icon: BarChart3, description: "متابعة فواتير الشراء والتزامات الموردين" },
    ]
  },
  {
    title: "المالية والرقابة",
    items: [
      { to: "/reports/treasury", label: "تقرير الخزينة", icon: Banknote, description: "حركة الصندوق والتدفقات النقدية" },
      { to: "/audit", label: "مركز التدقيق", icon: ShieldCheck, description: "فحص سلامة البيانات واكتشاف الأخطاء" },
    ]
  }
];

function ReportsHubPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="مركز التقارير" description="كافة التقارير والإحصائيات المالية والتشغيلية" />
      
      <div className="grid gap-6">
        {REPORT_SECTIONS.map((section, idx) => (
          <div key={idx} className="space-y-3">
            <h3 className="px-1 text-sm font-semibold text-muted-foreground">{section.title}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {section.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to as any}
                  className="group flex items-center justify-between rounded-xl border bg-card p-5 transition-all hover:bg-accent hover:shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex size-12 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                      <item.icon className="size-6" />
                    </div>
                    <div>
                      <p className="font-semibold">{item.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                    </div>
                  </div>
                  <ChevronLeft className="size-5 text-muted-foreground transition-transform group-hover:-translate-x-1" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
