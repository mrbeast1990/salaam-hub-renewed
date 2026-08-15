import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Image as ImageIcon,
  UserPlus,
  Save,
  Barcode
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useMemo, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PartyForm } from "@/components/parties/party-form";
import { postSale } from "@/lib/sales/sales.functions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export function POSProducts({ onAdd }: { onAdd: (product: any) => void }) {
  const [search, setSearch] = useState("");
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const { data: products, isPending } = useQuery({
    queryKey: ["pos-products"],
    queryFn: async () => {
      const [{ data: pData, error: pErr }, { data: sData, error: sErr }] = await Promise.all([
        supabase.from("products").select("*, categories(name)").eq("active", true).order("name"),
        supabase.from("v_product_stock").select("*"),
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

  const filtered = useMemo(() => {
    if (!products) return [];
    const s = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.barcode?.toLowerCase().includes(s) ||
        p.sku?.toLowerCase().includes(s)
    );
  }, [products, search]);

  // الباركود: إذا كان البحث يطابق باركود بالتمام، أضفه فوراً وامسح البحث
  useEffect(() => {
    if (search.length > 3) {
      const match = products?.find(p => p.barcode === search);
      if (match) {
        onAdd(match);
        setSearch("");
        toast.success(`تمت إضافة ${match.name}`);
      }
    }
  }, [search, products, onAdd]);

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="relative">
        <Barcode className="absolute right-3 top-2.5 size-4 text-muted-foreground" />
        <Input
          ref={barcodeInputRef}
          placeholder="ابحث بالاسم أو الباركود..."
          className="pr-9 h-11 text-lg"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      <ScrollArea className="flex-1 -mx-2 px-2">
        {isPending ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">لا توجد نتائج</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((product) => (
              <Card 
                key={product.id} 
                className="cursor-pointer hover:border-primary transition-colors overflow-hidden flex flex-col group"
                onClick={() => onAdd(product)}
              >
                <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      className="size-full object-cover group-hover:scale-105 transition-transform" 
                    />
                  ) : (
                    <ImageIcon className="size-8 text-muted-foreground/30" />
                  )}
                  {Number(product.on_hand) <= 0 && (
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                      <Badge variant="destructive" className="font-normal">نفذت</Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-2 flex-1">
                  <div className="font-bold text-sm line-clamp-2 min-h-[2.5rem] leading-tight mb-1">
                    {product.name}
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-primary font-mono font-bold">{product.sale_price.toFixed(2)}</span>
                    <span className="text-[10px] text-muted-foreground">رصيد: {product.on_hand}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
