import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Upload, X, Save } from "lucide-react";
import { useState } from "react";
import { uploadProductImage, deleteProductImage } from "@/lib/storage";

const productSchema = z.object({
  name: z.string().min(1, "اسم الصنف مطلوب"),
  barcode: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  category_id: z.string().nullable().optional(),
  unit: z.string().default("قطعة"),
  pack_size: z.number().default(1),
  cost_price: z.number().min(0, "سعر الشراء يجب أن يكون 0 أو أكثر"),
  sale_price: z.number().min(0, "سعر البيع يجب أن يكون 0 أو أكثر"),
  min_stock: z.number().default(0),
  notes: z.string().nullable().optional(),
  active: z.boolean().default(true),
  image_url: z.string().nullable().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export function ProductForm({ 
  product, 
  onSuccess 
}: { 
  product?: any; 
  onSuccess: () => void 
}) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").eq("active", true).order("name");
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || "",
      barcode: product?.barcode || "",
      sku: product?.sku || "",
      category_id: product?.category_id || null,
      unit: product?.unit || "قطعة",
      pack_size: product?.pack_size || 1,
      cost_price: product?.cost_price || 0,
      sale_price: product?.sale_price || 0,
      min_stock: product?.min_stock || 0,
      notes: product?.notes || "",
      active: product?.active ?? true,
      image_url: product?.image_url || null,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      if (product?.id) {
        const { error } = await supabase
          .from("products")
          .update({ ...values, updated_at: new Date().toISOString() })
          .eq("id", product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("products")
          .insert([values]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(product?.id ? "تم تعديل الصنف بنجاح" : "تم إضافة الصنف بنجاح");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const url = await uploadProductImage(file);
    setUploading(false);

    if (url) {
      form.setValue("image_url", url);
    } else {
      toast.error("فشل رفع الصورة");
    }
  };

  const removeImage = async () => {
    const url = form.getValues("image_url");
    if (url) {
      await deleteProductImage(url);
      form.setValue("image_url", null);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم الصنف *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="مثال: حليب المراعي 1 لتر" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الباركود</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الكود الداخلي</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>التصنيف</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر تصنيفاً" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوحدة</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pack_size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>حجم العبوة</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(Number(e.target.value))} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="cost_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>سعر الشراء</FormLabel>
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
                name="sale_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>سعر البيع</FormLabel>
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
            </div>

            <FormField
              control={form.control}
              name="min_stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الحد الأدنى للمخزون</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={e => field.onChange(Number(e.target.value))} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>صورة الصنف</FormLabel>
              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 transition-colors hover:border-primary/50 relative min-h-[140px]">
                {form.watch("image_url") ? (
                  <div className="relative w-full aspect-square max-w-[120px]">
                    <img 
                      src={form.watch("image_url")!} 
                      alt="Product" 
                      className="w-full h-full object-contain rounded-md" 
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-2 cursor-pointer">
                    {uploading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">اضغط لرفع صورة</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      disabled={uploading} 
                    />
                  </label>
                )}
              </div>
            </FormItem>

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <FormLabel className="cursor-pointer">حالة الصنف (نشط)</FormLabel>
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
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ملاحظات</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value || ""} rows={2} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            className="w-full md:w-auto min-w-[150px]" 
            disabled={mutation.isPending || uploading}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="ml-2 h-4 w-4" />
                حفظ الصنف
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
