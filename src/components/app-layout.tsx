import type { ReactNode } from "react";
import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Store,
  Home,
  ArrowRight,
} from "lucide-react";

export function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const isHome = location.pathname === "/";

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50 dark:bg-slate-950">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4">
          {!isHome && (
            <Button variant="ghost" size="icon" asChild className="md:hidden">
              <Link to="/">
                <ArrowRight className="size-5" />
              </Link>
            </Button>
          )}
          
          <Link to="/" className="flex items-center gap-2 font-black tracking-tight">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Store className="size-4" />
            </span>
            <span>سلام</span>
          </Link>

          <div className="flex items-center gap-2 ms-auto">
            {!isHome && (
              <Button variant="ghost" size="icon" asChild title="الرئيسية">
                <Link to="/">
                  <Home className="size-5" />
                </Link>
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground"
              onClick={handleSignOut}
              title="خروج"
            >
              <LogOut className="size-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4">{children}</main>

      {/* Bottom Navigation Removed as requested */}
    </div>
  );
}
