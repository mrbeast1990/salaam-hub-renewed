import { useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { postPurchase } from "@/lib/purchases/purchases.functions";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  Package, 
  UserPlus,
  ArrowRight
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PartyForm } from "@/components/parties/party-form";

const purchaseSchema = z.object({
  supplier_id: z.string().min(1, "يجب اختيار مورد"),
  supplier_name: z.string().min(1),
  transaction_date: z.string(),
  payment_method: z.string(),
  paid: z.number().min(0),
  discount: z.number().min(0),
  notes: z.string().nullable(),
  items: z.array(
    z.object({
      product_id: z.string().min(1, "يجب اختيار صنف"),
      product_name: z.string(),
      qty: z.number().min(0.01, "الكمية يجب أن تكون أكبر من 0"),
      unit_price: z.number().min(0, "السعر يجب أن يكون 0 أو أكثر"),
      line_discount: z.number().default(0),
    })
  ).min(1, "يجب إضافة صنف واحد على الأقل"),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;


export function PurchaseForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [productSearch, setProductSearch] = useState("");
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [idempotencyKey] = useState(uuidv4());

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("*").eq("active", true).order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ["products-search", productSearch],
    queryFn: async () => {
      if (!productSearch) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .or(`name.ilike.%${productSearch}%,barcode.ilike.%${productSearch}%`)
        .eq("active", true)
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: productSearch.length > 1,
  });

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      transaction_date: new Date().toISOString().split("T")[0],
      payment_method: "cash",
      paid: 0,
      discount: 0,
      notes: "",
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const subtotal = useMemo(() => {
    return fields.reduce((acc, field, index) => {
      const qty = form.watch(`items.${index}.qty`) || 0;
      const price = form.watch(`items.${index}.unit_price`) || 0;
      return acc + qty * price;
    }, 0);
  }, [fields, form.watch("items")]);

  const discount = form.watch("discount") || 0;
  const total = subtotal - discount;

  const mutation = useMutation({
    mutationFn: (values: PurchaseFormValues) => postPurchase({ data: { ...values, idempotency_key: idempotencyKey, tax: 0 } }),
    onSuccess: (purchaseId) => {

      toast.success("تم حفظ فاتورة الشراء بنجاح");
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      navigate({ to: "/purchases" });
    },
    onError: (error: any) => {
      toast.error(error.message || "فشل حفظ فاتورة الشراء");
    },
  });

  const addProduct = (product: any) => {
    const existingIndex = fields.findIndex((f) => f.product_id === product.id);
    if (existingIndex > -1) {
      const currentQty = form.getValues(`items.${existingIndex}.qty`);
      form.setValue(`items.${existingIndex}.qty`, currentQty + 1);
    } else {
      append({
        product_id: product.id,
        product_name: product.name,
        qty: 1,
        unit_price: product.cost_price || 0,
        line_discount: 0,
      });
    }
    setProductSearch("");
  };

  const handleSupplierChange = (val: string) => {
    const supplier = suppliers?.find(s => s.id === val);
    if (supplier) {
      form.setValue("supplier_id", supplier.id);
      form.setValue("supplier_name", supplier.name);
    }
  };

  const handlePaymentMethodChange = (val: string) => {
    form.setValue("payment_method", val);
    if (val === "cash" || val === "bank") {
      form.setValue("paid", total);
    } else if (val === "credit") {
      form.setValue("paid", 0);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <PageHeader title="إنشاء فاتورة شراء" />
        <Button variant="ghost" onClick={() => navigate({ to: "/purchases" })}>
          <ArrowRight className="size-4 ml-2" />
          رجوع
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="size-5 text-primary" />
                    الأصناف
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute right-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      placeholder="ابحث عن صنف بالاسم أو الباركود..."
                      className="pr-9"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                    {products && products.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {products.map((p) => (
                          <div
                            key={p.id}
                            className="p-2 hover:bg-muted cursor-pointer flex justify-between items-center border-b last:border-0"
                            onClick={() => addProduct(p)}
                          >
                            <div className="flex items-center gap-3">
                              {p.image_url && (
                                <img src={p.image_url} className="size-8 rounded object-cover" />
                              )}
                              <div>
                                <div className="font-medium text-sm">{p.name}</div>
                                <div className="text-xs text-muted-foreground">{p.barcode || "بدون باركود"}</div>
                              </div>
                            </div>
                            <div className="text-sm font-bold text-primary">{p.cost_price.toFixed(2)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>الصنف</TableHead>
                          <TableHead className="w-[100px] text-center">الكمية</TableHead>
                          <TableHead className="w-[120px] text-left">سعر الشراء</TableHead>
                          <TableHead className="w-[120px] text-left">الإجمالي</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                              لم يتم إضافة أي أصناف بعد
                            </TableCell>
                          </TableRow>
                        ) : (
                          fields.map((field, index) => (
                            <TableRow key={field.id}>
                              <TableCell className="font-medium">
                                {form.watch(`items.${index}.product_name`)}
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  className="h-8 text-center"
                                  {...form.register(`items.${index}.qty`, { valueAsNumber: true })}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  className="h-8 text-left"
                                  {...form.register(`items.${index}.unit_price`, { valueAsNumber: true })}
                                />
                              </TableCell>
                              <TableCell className="text-left font-mono">
                                {(
                                  (form.watch(`items.${index}.qty`) || 0) *
                                  (form.watch(`items.${index}.unit_price`) || 0)
                                ).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-destructive"
                                  onClick={() => remove(index)}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">ملاحظات الفاتورة</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea 
                            placeholder="اكتب أي ملاحظات إضافية هنا..." 
                            rows={3} 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">بيانات المورد والدفع</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <FormLabel>المورد *</FormLabel>
                    <div className="flex gap-2">
                      <FormField
                        control={form.control}
                        name="supplier_id"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <Select onValueChange={handleSupplierChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر مورداً" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {suppliers?.map((s) => (
                                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" size="icon">
                            <UserPlus className="size-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>إضافة مورد جديد</DialogTitle>
                          </DialogHeader>
                          <PartyForm 
                            type="supplier" 
                            onSuccess={(supplier) => {
                              setIsAddSupplierOpen(false);
                              queryClient.invalidateQueries({ queryKey: ["suppliers"] });
                              if (supplier) {
                                handleSupplierChange(supplier.id);
                              }
                            }} 
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="transaction_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تاريخ الفاتورة</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="payment_method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>طريقة الدفع</FormLabel>
                        <Select onValueChange={handlePaymentMethodChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">نقدي</SelectItem>
                            <SelectItem value="bank">بنكي</SelectItem>
                            <SelectItem value="credit">آجل</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4 border-t space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">الإجمالي</span>
                      <span className="font-mono font-bold">{subtotal.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground whitespace-nowrap text-sm">الخصم</span>
                      <FormField
                        control={form.control}
                        name="discount"
                        render={({ field }) => (
                          <FormItem className="w-24">
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                className="h-8 text-left text-xs"
                                {...field}
                                onChange={e => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-between items-center text-lg font-bold pt-2 border-t">
                      <span>الصافي</span>
                      <span className="text-primary font-mono">{total.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2">
                      <span className="text-green-600 font-medium whitespace-nowrap text-sm">المبلغ المدفوع</span>
                      <FormField
                        control={form.control}
                        name="paid"
                        render={({ field }) => (
                          <FormItem className="w-28">
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                className="h-9 text-left font-bold text-green-700"
                                {...field}
                                onChange={e => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-destructive font-medium">المتبقي</span>
                      <span className="font-mono text-destructive">{(total - (form.watch("paid") || 0)).toFixed(2)}</span>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full mt-4" 
                    size="lg"
                    disabled={mutation.isPending || fields.length === 0}
                  >
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="ml-2 size-4 animate-spin" />
                        جاري حفظ الفاتورة...
                      </>
                    ) : (
                      <>
                        <Save className="ml-2 size-4" />
                        حفظ الفاتورة
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
