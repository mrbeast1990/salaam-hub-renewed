import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Store } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — سلام لإدارة المبيعات" },
      {
        name: "description",
        content: "تسجيل دخول المدير إلى نظام سلام لإدارة المبيعات والمخزون والخزينة.",
      },
      { property: "og:title", content: "تسجيل الدخول — سلام لإدارة المبيعات" },
      {
        property: "og:description",
        content: "دخول المدير إلى نظام سلام لإدارة المبيعات والمخزون والخزينة.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) navigate({ to: "/", replace: true });
      else setChecking(false);
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error("فشل تسجيل الدخول: " + error.message);
      setBusy(false);
      return;
    }
    toast.success("تم تسجيل الدخول");
    navigate({ to: "/", replace: true });
    setBusy(false);
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      toast.error("فشل إنشاء الحساب: " + error.message);
      setBusy(false);
      return;
    }
    toast.success("تم إنشاء حساب المدير. جاري الدخول…");
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      toast.error("أُنشئ الحساب لكن الدخول فشل: " + signInError.message);
      setBusy(false);
      return;
    }
    navigate({ to: "/", replace: true });
    setBusy(false);
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Store className="size-6" />
          </div>
          <CardTitle className="text-xl">سلام لإدارة المبيعات</CardTitle>
          <p className="text-sm text-muted-foreground">حساب المدير فقط</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">دخول</TabsTrigger>
              <TabsTrigger value="signup">إنشاء حساب المدير</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form className="space-y-4 pt-4" onSubmit={handleSignIn}>
                <Fields
                  email={email}
                  password={password}
                  onEmail={setEmail}
                  onPassword={setPassword}
                  disabled={busy}
                />
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  دخول
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form className="space-y-4 pt-4" onSubmit={handleSignUp}>
                <Fields
                  email={email}
                  password={password}
                  onEmail={setEmail}
                  onPassword={setPassword}
                  disabled={busy}
                />
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  إنشاء الحساب
                </Button>
                <p className="text-xs text-muted-foreground">
                  استخدم هذا مرة واحدة لإنشاء حساب المدير، ثم اعتمد على الدخول فقط.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function Fields({
  email,
  password,
  onEmail,
  onPassword,
  disabled,
}: {
  email: string;
  password: string;
  onEmail: (v: string) => void;
  onPassword: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input
          id="email"
          type="email"
          required
          dir="ltr"
          value={email}
          disabled={disabled}
          onChange={(e) => onEmail(e.target.value)}
          placeholder="manager@example.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">كلمة المرور</Label>
        <Input
          id="password"
          type="password"
          required
          dir="ltr"
          minLength={6}
          value={password}
          disabled={disabled}
          onChange={(e) => onPassword(e.target.value)}
        />
      </div>
    </>
  );
}
