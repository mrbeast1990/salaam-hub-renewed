import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Search, Package, Image as ImageIcon, Edit2, AlertCircle, History as HistoryIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProductForm } from "@/components/inventory/product-form";
import { Badge } from "@/components/ui/badge";

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
  const queryClient = useQueryClient();

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
                  <TableHead className="w-[100px]"></TableHead>
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
                      <TableCell className="text-left">{p.sale_price.toFixed(2)}</TableCell>
                      <TableCell className={`text-left font-bold ${Number(p.on_hand) <= Number(p.min_stock) ? 'text-destructive' : ''}`}>
                        {p.on_hand}
                      </TableCell>
                      <TableCell className="text-left">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link to="/products/$id" params={{ id: p.id }}>
                              <HistoryIcon className="size-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
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
            onSuccess={() => setIsFormOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
