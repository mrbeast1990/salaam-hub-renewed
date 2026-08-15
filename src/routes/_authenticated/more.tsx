import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Settings, 
  History, 
  FileText, 
  ChevronLeft, 
  Bell,
  CreditCard,
  UserCircle,
  ShoppingCart,
  DollarSign,
  Package
} from "lucide-react";


export const Route = createFileRoute("/_authenticated/more")({
  head: () => ({
    meta: [
      { title: "المزيد — سلام لإدارة المبيعات" },
      { name: "description", content: "الإعدادات، سجل العمليات، التقارير، والتنبيهات." },
    ],
  }),
  component: MorePage,
});

const MENU_ITEMS = [
  {
    title: "الضبط والإعدادات",
    items: [
      { to: "/settings", label: "إعدادات المنشأة", icon: Settings, description: "الاسم، الشعار، العملة، والأرصدة الافتتاحية" },
      { to: "/notifications", label: "التنبيهات", icon: Bell, description: "تنبيهات المخزون والعمليات" },
    ]
  },
  {
    title: "التقارير والسجلات",
    items: [
      { to: "/reports", label: "التقارير المالية", icon: FileText, description: "الأرباح، المبيعات، كشوف الحسابات" },
      { to: "/audit", label: "سجل العمليات", icon: History, description: "تتبع كافة الحركات والتحقق من صحتها" },
    ]
  },
  {
    title: "الخزينة والحسابات",
    items: [
      { to: "/purchases", label: "المشتريات", icon: ShoppingCart, description: "إدارة فواتير الشراء والموردين" },
      { to: "/expenses", label: "المصروفات", icon: DollarSign, description: "تسجيل ومتابعة المصروفات الإدارية" },
      { to: "/inventory", label: "المخزون", icon: Package, description: "جرد الأصناف وحركات المستودع" },
      { to: "/treasury", label: "الخزينة والبنوك", icon: CreditCard, description: "متابعة السيولة وحركات الصندوق" },
      { to: "/customers", label: "العملاء والموردين", icon: UserCircle, description: "إدارة جهات الاتصال والأرصدة" },
    ]
  }

];

function MorePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="المزيد" description="إعدادات النظام والتقارير المتقدمة" />

      <div className="grid gap-6">
        {MENU_ITEMS.map((section, idx) => (
          <div key={idx} className="space-y-3">
            <h3 className="px-1 text-sm font-semibold text-muted-foreground">
              {section.title}
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {section.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to as any}
                  className="group flex items-center justify-between rounded-xl border bg-card p-4 transition-all hover:bg-accent hover:shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                      <item.icon className="size-5" />
                    </div>
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <ChevronLeft className="size-4 text-muted-foreground transition-transform group-hover:-translate-x-1" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="pt-4 text-center">
        <p className="text-[10px] text-muted-foreground/60">
          سلام لإدارة المبيعات v2.0.0
        </p>
      </div>
    </div>
  );
}
