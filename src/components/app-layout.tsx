import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Package,
  Users,
  BarChart3,
  ShieldCheck,
  Settings,
  LogOut,
  Store,
} from "lucide-react";

const NAV = [
  { to: "/", label: "لوحة", icon: LayoutDashboard },
  { to: "/sales", label: "مبيعات", icon: ShoppingCart },
  { to: "/purchases", label: "مشتريات", icon: Truck },
  { to: "/inventory", label: "مخزون", icon: Package },
  { to: "/customers", label: "الزبائن", icon: Users },
  { to: "/reports", label: "التقارير", icon: BarChart3 },
  { to: "/audit", label: "التدقيق", icon: ShieldCheck },
  { to: "/settings", label: "الإعدادات", icon: Settings },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="size-4" />
            </span>
            <span className="hidden sm:inline">سلام لإدارة المبيعات</span>
          </Link>

          <nav className="ms-4 hidden items-center gap-1 md:flex">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                activeProps={{ className: "bg-accent text-foreground font-medium" }}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>

          <Button
            variant="ghost"
            size="sm"
            className="ms-auto gap-2"
            onClick={handleSignOut}
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">خروج</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-4 md:pb-8">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background md:hidden">
        <div className="grid grid-cols-8">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex flex-col items-center gap-1 py-2 text-[10px] text-muted-foreground"
              activeProps={{ className: "text-primary font-medium" }}
            >
              <Icon className="size-4" />
              <span className="truncate w-full text-center">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
