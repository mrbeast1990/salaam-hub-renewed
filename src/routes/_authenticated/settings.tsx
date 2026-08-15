import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save, Building2, Phone, MapPin, Mail, Globe, Banknote, Calendar } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات — سلام لإدارة المبيعات" },
      { name: "description", content: "إدارة بيانات المنشأة، العملة، ورصيد الخزينة الافتتاحي." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: settings, isPending } = useQuery({
    queryKey: ["app_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("*").eq("id", 1).maybeSingle();
      if (error) throw error;
      // If no settings exist yet, return defaults
      return data || {
        id: 1,
        company_name: "",
        company_phone: "",
        company_address: "",
        company_email: "",
        currency: "SAR",
        opening_cash: 0,
        opening_bank: 0,
        opening_as_of_date: new Date().toISOString().split("T")[0],
      };
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase.from("app_settings").upsert({
        id: 1,
        ...values,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم حفظ الإعدادات بنجاح");
      queryClient.invalidateQueries({ queryKey: ["app_settings"] });
    },
    onError: (error: any) => {
      toast.error("فشل الحفظ: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const values = {
      company_name: formData.get("company_name"),
      company_phone: formData.get("company_phone"),
      company_address: formData.get("company_address"),
      company_email: formData.get("company_email"),
      currency: formData.get("currency"),
      opening_cash: Number(formData.get("opening_cash")),
      opening_bank: Number(formData.get("opening_bank")),
      opening_as_of_date: formData.get("opening_as_of_date"),
    };
    mutation.mutate(values);
  };

  if (isPending) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="الإعدادات" description="إدارة هوية المنشأة والضبط المالي" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4" />
              بيانات المنشأة
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company_name">اسم المنشأة</Label>
              <Input id="company_name" name="company_name" defaultValue={settings?.company_name || ""} placeholder="مثال: شركة السلام التجارية" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_phone">رقم الهاتف</Label>
              <div className="relative">
                <Phone className="absolute right-3 top-2.5 size-4 text-muted-foreground" />
                <Input id="company_phone" name="company_phone" className="pr-9" defaultValue={settings?.company_phone || ""} dir="ltr" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_email">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-2.5 size-4 text-muted-foreground" />
                <Input id="company_email" name="company_email" type="email" className="pr-9" defaultValue={settings?.company_email || ""} dir="ltr" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_address">العنوان</Label>
              <div className="relative">
                <MapPin className="absolute right-3 top-2.5 size-4 text-muted-foreground" />
                <Input id="company_address" name="company_address" className="pr-9" defaultValue={settings?.company_address || ""} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Banknote className="size-4" />
              الضبط المالي والأرصدة الافتتاحية
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="currency">العملة</Label>
              <div className="relative">
                <Globe className="absolute right-3 top-2.5 size-4 text-muted-foreground" />
                <Input id="currency" name="currency" className="pr-9" defaultValue={settings?.currency || "SAR"} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="opening_as_of_date">تاريخ الرصيد الافتتاحي</Label>
              <div className="relative">
                <Calendar className="absolute right-3 top-2.5 size-4 text-muted-foreground" />
                <Input id="opening_as_of_date" name="opening_as_of_date" type="date" className="pr-9" defaultValue={settings?.opening_as_of_date} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="opening_cash">الخزينة (نقدي)</Label>
              <Input id="opening_cash" name="opening_cash" type="number" step="0.01" defaultValue={settings?.opening_cash || 0} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="opening_bank">البنك (شبكة/تحويل)</Label>
              <Input id="opening_bank" name="opening_bank" type="number" step="0.01" defaultValue={settings?.opening_bank || 0} required />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending} className="min-w-[150px] gap-2">
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            حفظ الإعدادات
          </Button>
        </div>
      </form>
    </div>
  );
}
