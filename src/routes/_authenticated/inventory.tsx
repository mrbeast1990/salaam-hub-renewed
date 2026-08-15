import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Search, Package, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/inventory")({
  head: () => ({
    meta: [
      { title: "الأصناف والمخزون — سلام" },
    ],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: products, isPending, isError } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      // Joining with v_product_stock is not directly supported via standard select if not foreign key,
      // but we can query both and map in memory.
      const [{ data: pData, error: pErr }, { data: sData, error: sErr }] = await Promise.all([
        supabase.from("products").select("*").order("name"),
        supabase.from("v_product_stock").select("product_id, on_hand"),
      ]);
      if (pErr) throw pErr;
      if (sErr) throw sErr;

      const stockMap = new Map(sData.map((s) => [s.product_id, s.on_hand]));

      return pData.map((p) => ({
        ...p,
        on_hand: stockMap.get(p.id) || 0,
      }));
    },
  });

  const filtered = products?.filter((p) => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="الأصناف والمخزون"
        action={
          <Button onClick={() => toast.info("سيتم إضافة نموذج الإضافة لاحقاً")}>
            <Plus className="size-4 ml-2" />
            إضافة صنف
          </Button>
        }
      />

      <div className="relative">
        <Search className="absolute right-3 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="بحث بالاسم أو الباركود..."
          className="pr-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الصنف</TableHead>
                <TableHead>الباركود</TableHead>
                <TableHead className="text-left">السعر</TableHead>
                <TableHead className="text-left">الرصيد</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <Loader2 className="size-8 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filtered?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    لا توجد أصناف مطابقة.
                  </TableCell>
                </TableRow>
              ) : (
                filtered?.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.barcode || "—"}</TableCell>
                    <TableCell className="text-left">{p.sale_price.toFixed(2)}</TableCell>
                    <TableCell className="text-left font-bold">{p.on_hand}</TableCell>
                    <TableCell className="text-left">
                      <Button variant="ghost" size="sm">تعديل</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
