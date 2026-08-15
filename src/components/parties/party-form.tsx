import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save } from "lucide-react";
import { setOpeningBalance } from "@/lib/balance-utils";

const partySchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  notes: z.string().nullable(),
  active: z.boolean(),
  opening_balance: z.number(),
  opening_date: z.string(),
});

type PartyFormValues = z.infer<typeof partySchema>;

export function PartyForm({ 
  party, 
  type, 
  onSuccess 
}: { 
  party?: any; 
  type: 'customer' | 'supplier';
   onSuccess: (party?: any) => void 
 }) {
  const queryClient = useQueryClient();
  const isNew = !party?.id;

  const form = useForm<PartyFormValues>({
    resolver: zodResolver(partySchema),
    defaultValues: {
      name: party?.name || "",
      phone: party?.phone || null,
      address: party?.address || null,
      notes: party?.notes || null,
      active: party?.active ?? true,
      opening_balance: 0, // Only used on creation
      opening_date: new Date().toISOString().split('T')[0],
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: PartyFormValues) => {
      const { opening_balance, opening_date, ...rest } = values;
      
      let partyId = party?.id;
      let partyData = null;

      if (isNew) {
        const table = type === 'customer' ? 'customers' : 'suppliers';
        const { data, error } = await supabase
          .from(table)
          .insert([rest])
          .select()
          .single();
        if (error) throw error;
        partyId = data.id;
        partyData = data;

        // Apply opening balance if provided
        if (opening_balance !== 0) {
          await setOpeningBalance({
            partyId,
            partyType: type,
            amount: opening_balance,
            asOfDate: opening_date,
          });
        }
      } else {
        const table = type === 'customer' ? 'customers' : 'suppliers';
        const { data, error } = await supabase
          .from(table)
          .update({ ...rest, updated_at: new Date().toISOString() })
          .eq("id", partyId)
          .select()
          .single();
        if (error) throw error;
        partyData = data;
      }
      return partyData;
    },
    onSuccess: (data) => {
      toast.success(isNew ? "تمت الإضافة بنجاح" : "تم التعديل بنجاح");
      queryClient.invalidateQueries({ queryKey: ["parties"] });
      onSuccess(data);
    },
    onError: (error: any) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الاسم الكامل *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>رقم الهاتف</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} dir="ltr" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-8">
                <FormLabel className="cursor-pointer">نشط</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>العنوان</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isNew && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
            <FormField
              control={form.control}
              name="opening_balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رصيد أول المدة (مدين موجب، دائن سالب)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...field} 
                      onChange={e => field.onChange(Number(e.target.value))} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="opening_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تاريخ الرصيد الافتتاحي</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ملاحظات</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value || ""} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            className="w-full md:w-auto min-w-[150px]" 
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="ml-2 h-4 w-4" />
                حفظ البيانات
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
