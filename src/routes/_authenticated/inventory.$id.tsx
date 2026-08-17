import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Package, 
  History, 
  TrendingUp, 
  AlertCircle,
  Loader2,
  Calendar,
  Tag
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { useServerFn } from "@tanstack/react-start";
import { getProductMovements } from "@/lib/inventory/inventory.functions";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/inventory_")({
  path: "/inventory/$id",
  head: () => ({
    meta: [{ title: "تفاصيل الصنف — سلام" }],
  }),
  component: ProductDetailsPage,
});

function ProductDetailsPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const fetchMovements = useServerFn(getProductMovements);

  const { data: product, isPending: isProductPending } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("id", id)
        .single();
      if (error) throw error;
      
      const { data: stockData } = await supabase
        .from("v_product_stock")
        .select("on_hand")
        .eq("product_id", id)
        .single();
        
      return { ...data, on_hand: stockData?.on_hand || 0 };
    },
  });

  const { data: movements, isPending: isMovementsPending } = useQuery({
    queryKey: ["product-movements", id],
    queryFn: () => fetchMovements({ data: { product_id: id } }),
  });

  if (isProductPending) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="size-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold">الصنف غير موجود</h2>
        <Button variant="link" onClick={() => navigate({ to: "/inventory" })}>العودة للمخزون</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/inventory" })}>
          <ArrowRight className="size-5" />
        </Button>
        <PageHeader title={product.name} description={product.sku || product.barcode || "تفاصيل وحركة الصنف"} />
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
                <p className="font-bold">{(product as any).categories?.name || "بدون تصنيف"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">الباركود</p>
                <p className="font-mono font-bold text-sm">{product.barcode || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">الكود الداخلي</p>
                <p className="font-mono font-bold text-sm">{product.sku || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">سعر الشراء</p>
                <p className="font-black text-lg tabular-nums">{formatCurrency(product.cost_price)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">سعر البيع</p>
                <p className="font-black text-lg tabular-nums text-primary">{formatCurrency(product.sale_price)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">الحد الأدنى</p>
                <p className="font-bold tabular-nums">{formatNumber(product.min_stock)}</p>
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
            <div className={`text-5xl font-black tabular-nums ${product.on_hand <= product.min_stock ? 'text-destructive' : 'text-primary'}`}>
              {formatNumber(product.on_hand)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">وحدة متوفرة في المخزن</p>
            {product.on_hand <= product.min_stock && (
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
            <History className="size-5 text-primary" />
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
  );
}