import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { postPayment } from "@/lib/payments/payments.functions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

const paymentSchema = z.object({
  party_id: z.string().min(1, "يجب اختيار الطرف"),
  party_type: z.enum(["customer", "supplier"]),
  amount: z.coerce.number().positive("يجب أن يكون المبلغ أكبر من صفر"),
  transaction_date: z.string().min(1, "يجب اختيار التاريخ"),
  method: z.string().min(1, "يجب اختيار طريقة السداد"),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export function PaymentForm({ onSuccess }: { onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idempotencyKey] = useState(uuidv4());
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      party_type: "customer",
      transaction_date: new Date().toISOString().split("T")[0],
      method: "نقدي",
    }
  });

  const partyType = watch("party_type");

  const { data: parties } = useQuery({
    queryKey: ["parties-list", partyType],
    queryFn: async () => {
      const table = partyType === "customer" ? "customers" : "suppliers";
      const { data, error } = await supabase.from(table).select("id, name").eq("active", true).order("name");
      if (error) throw error;
      return data;
    }
  });

  const onSubmit = async (values: PaymentFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await postPayment({
        data: {
          ...values,
          idempotency_key: idempotencyKey,
        }
      });

      toast.success("تم تسجيل السداد بنجاح");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "فشل تسجيل السداد");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>نوع الطرف</Label>
          <Select 
            value={partyType} 
            onValueChange={(v: any) => setValue("party_type", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="customer">عميل</SelectItem>
              <SelectItem value="supplier">مورد</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>طريقة السداد</Label>
          <Select 
            defaultValue="نقدي" 
            onValueChange={(v) => setValue("method", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="نقدي">نقدي</SelectItem>
              <SelectItem value="شبكة">شبكة</SelectItem>
              <SelectItem value="تحويل بنكي">تحويل بنكي</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>اختيار {partyType === 'customer' ? 'العميل' : 'المورد'}</Label>
        <Select onValueChange={(v) => setValue("party_id", v)}>
          <SelectTrigger>
            <SelectValue placeholder="اختر من القائمة..." />
          </SelectTrigger>
          <SelectContent>
            {parties?.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.party_id && <p className="text-xs text-destructive">{errors.party_id.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>المبلغ</Label>
          <Input 
            type="number" 
            step="0.01" 
            placeholder="0.00" 
            {...register("amount")}
          />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>التاريخ</Label>
          <Input type="date" {...register("transaction_date")} />
          {errors.transaction_date && <p className="text-xs text-destructive">{errors.transaction_date.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>ملاحظات</Label>
        <Textarea {...register("notes")} placeholder="أي تفاصيل إضافية..." />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="ml-2 size-4 animate-spin" />
            جاري تسجيل السداد...
          </>
        ) : (
          "حفظ السداد"
        )}
      </Button>
    </form>
  );
}
