import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Loader2, 
  Plus, 
  Search, 
  Package, 
  Image as ImageIcon, 
  Edit2, 
  AlertCircle, 
  History as HistoryIcon,
  ArrowRight,
  TrendingUp,
  X
} from "lucide-react";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProductForm } from "@/components/inventory/product-form";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { useServerFn } from "@tanstack/react-start";
import { getProductMovements } from "@/lib/inventory/inventory.functions";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/inventory")({
  head: () => ({
    meta: [{ title: "الأصناف والمخزون — سلام" }],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [viewingMovementProductId, setViewingMovementProductId] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  const fetchMovements = useServerFn(getProductMovements);

  const { data: products, isPending, isError, refetch } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const [{ data: pData, error: pErr }, { data: sData, error: sErr }] = await Promise.all([
        supabase.from("products").select("*, categories(name)").order("name"),
        supabase.from("v_product_stock").select("product_id, on_hand"),
      ]);
      if (pErr) throw pErr;
      if (sErr) throw sErr;

      const stockMap = new Map(sData.map((s) => [s.product_id, s.on_hand]));

      return pData.map((p) => ({
        ...p,
        on_hand: stockMap.get(p.id) || 0,
        category_name: (p as any).categories?.name || "بدون تصنيف",
      }));
    },
  });

  const productForMovement = useMemo(() => 
    products?.find(p => p.id === viewingMovementProductId),
    [products, viewingMovementProductId]
  );

  const { data: movements, isPending: isMovementsPending } = useQuery({
    queryKey: ["product-movements", viewingMovementProductId],
    queryFn: () => fetchMovements({ data: { product_id: viewingMovementProductId! } }),
    enabled: !!viewingMovementProductId
  });

  const filtered = products?.filter((p) => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (product: any) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedProduct(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-4">
      {viewingMovementProductId && productForMovement ? (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setViewingMovementProductId(null)}>
              <ArrowRight className="size-5" />
            </Button>
            <PageHeader title={productForMovement.name} description={productForMovement.sku || productForMovement.barcode || "تفاصيل وحركة الصنف"} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="size-5 text-primary" />
                  المعلومات الأساسية
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">التصنيف</p>
                    <p className="font-bold">{productForMovement.category_name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">الباركود</p>
                    <p className="font-mono font-bold text-sm">{productForMovement.barcode || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">الكود الداخلي</p>
                    <p className="font-mono font-bold text-sm">{productForMovement.sku || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">سعر الشراء</p>
                    <p className="font-black text-lg tabular-nums">{formatCurrency(productForMovement.cost_price)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">سعر البيع</p>
                    <p className="font-black text-lg tabular-nums text-primary">{formatCurrency(productForMovement.sale_price)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">الحد الأدنى</p>
                    <p className="font-bold tabular-nums">{formatNumber(productForMovement.min_stock)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-primary/5 border-primary/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="size-5 text-primary" />
                  الرصيد الحالي
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <div className={`text-5xl font-black tabular-nums ${productForMovement.on_hand <= productForMovement.min_stock ? 'text-destructive' : 'text-primary'}`}>
                  {formatNumber(productForMovement.on_hand)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">وحدة متوفرة في المخزن</p>
                {productForMovement.on_hand <= productForMovement.min_stock && (
                  <Badge variant="destructive" className="mt-4 gap-1">
                    <AlertCircle className="size-3" />
                    رصيد منخفض
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <HistoryIcon className="size-5 text-primary" />
                سجل حركات المخزون
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">التاريخ</TableHead>
                      <TableHead className="w-[100px]">النوع</TableHead>
                      <TableHead>الكمية</TableHead>
                      <TableHead>التكلفة</TableHead>
                      <TableHead>البيان</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isMovementsPending ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10">
                          <Loader2 className="size-6 animate-spin mx-auto text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : movements?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          لا توجد حركات مخزون مسجلة لهذا الصنف.
                        </TableCell>
                      </TableRow>
                    ) : (
                      movements?.map((m: any) => (
                        <TableRow key={m.id}>
                          <TableCell className="text-xs text-muted-foreground">
                            {format(new Date(m.transaction_date), "yyyy-MM-dd", { locale: ar })}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] font-bold ${
                                m.qty_delta > 0 
                                  ? "border-green-200 text-green-700 bg-green-50" 
                                  : "border-red-200 text-red-700 bg-red-50"
                              }`}
                            >
                              {m.source_type === 'sale' ? 'بيع' : 
                               m.source_type === 'purchase' ? 'شراء' :
                               m.source_type === 'adjustment' ? 'تعديل' : m.source_type}
                            </Badge>
                          </TableCell>
                          <TableCell className={`font-bold tabular-nums ${m.qty_delta > 0 ? "text-green-600" : "text-red-600"}`}>
                            {m.qty_delta > 0 ? "+" : ""}{formatNumber(m.qty_delta)}
                          </TableCell>
                          <TableCell className="text-xs tabular-nums text-muted-foreground">
                            {formatCurrency(m.unit_cost)}
                          </TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate">
                            {m.notes || "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <PageHeader
            title="الأصناف والمخزون"
            action={
              <Button onClick={handleAdd}>
                <Plus className="size-4 ml-2" />
                إضافة صنف
              </Button>
            }
          />

          <div className="relative">
            <Search className="absolute right-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم، الباركود، أو الكود الداخلي..."
              className="pr-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">الصورة</TableHead>
                      <TableHead>الصنف</TableHead>
                      <TableHead>التصنيف</TableHead>
                      <TableHead>الباركود</TableHead>
                      <TableHead className="text-left">سعر البيع</TableHead>
                      <TableHead className="text-left">الرصيد</TableHead>
                      <TableHead className="w-[120px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isPending ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10">
                          <Loader2 className="size-8 animate-spin mx-auto text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : isError ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10">
                          <div className="flex flex-col items-center gap-2">
                            <AlertCircle className="size-8 text-destructive" />
                            <p>فشل تحميل البيانات</p>
                            <Button variant="outline" size="sm" onClick={() => refetch()}>إعادة المحاولة</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filtered?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                          لا توجد أصناف مطابقة.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered?.map((p) => (
                        <TableRow key={p.id} className={!p.active ? "opacity-50" : ""}>
                          <TableCell>
                            <div className="size-10 rounded border bg-muted flex items-center justify-center overflow-hidden">
                              {p.image_url ? (
                                <img src={p.image_url} alt={p.name} className="size-full object-cover" />
                              ) : (
                                <ImageIcon className="size-5 text-muted-foreground/50" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{p.name}</div>
                            {p.sku && <div className="text-xs text-muted-foreground">{p.sku}</div>}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">{p.category_name}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{p.barcode || "—"}</TableCell>
                          <TableCell className="text-left tabular-nums">{formatCurrency(p.sale_price)}</TableCell>
                          <TableCell className={`text-left font-bold tabular-nums ${Number(p.on_hand) <= Number(p.min_stock) ? 'text-destructive' : ''}`}>
                            {formatNumber(p.on_hand)}
                          </TableCell>
                          <TableCell className="text-left">
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setViewingMovementProductId(p.id)}
                                title="حركة المخزون"
                              >
                                <HistoryIcon className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(p)} title="تعديل">
                                <Edit2 className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedProduct ? `تعديل الصنف: ${selectedProduct.name}` : "إضافة صنف جديد"}
                </DialogTitle>
              </DialogHeader>
              <ProductForm 
                product={selectedProduct} 
                onSuccess={() => {
                  setIsFormOpen(false);
                  refetch();
                }} 
              />
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}