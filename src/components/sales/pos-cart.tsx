import { 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart,
  User,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface POSCartProps {
  items: any[];
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onSetQty: (id: string, qty: number) => void;
  selectedCustomer: any;
  onSelectCustomer: (customer: any) => void;
  onNewCustomer: () => void;
}

export function POSCart({ 
  items, 
  onUpdateQty, 
  onRemove, 
  onSetQty,
  selectedCustomer,
  onSelectCustomer,
  onNewCustomer
}: POSCartProps) {
  const { data: customers } = useQuery({
    queryKey: ["customers-pos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    }
  });

  const subtotal = items.reduce((sum, item) => sum + (item.qty * item.sale_price), 0);

  return (
    <Card className="h-full flex flex-col border-r-0 rounded-none shadow-none">
      <CardHeader className="p-4 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShoppingCart className="size-5" /> السلة
            <Badge variant="secondary" className="rounded-full">{items.length}</Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => items.forEach(i => onRemove(i.id))}>
            مسح الكل
          </Button>
        </div>
      </CardHeader>
      
      <div className="p-4 bg-muted/20 border-b space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <Select 
              value={selectedCustomer?.id || "cash"} 
              onValueChange={(val) => {
                if (val === "cash") onSelectCustomer(null);
                else {
                  const c = customers?.find(c => c.id === val);
                  if (c) onSelectCustomer(c);
                }
              }}
            >
              <SelectTrigger className="bg-background">
                <User className="size-4 ml-2 text-muted-foreground" />
                <SelectValue placeholder="اختر العميل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">عميل نقدي</SelectItem>
                {customers?.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="icon" onClick={onNewCustomer} title="إضافة عميل جديد">
            <UserPlus className="size-4" />
          </Button>
        </div>
        
        {selectedCustomer && (
          <div className="text-xs flex justify-between items-center px-1">
            <span className="text-muted-foreground">رصيد العميل الحالي:</span>
            <span className="font-bold text-primary">0.00</span>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-muted-foreground opacity-50">
            <ShoppingCart className="size-12 mb-2" />
            <p>السلة فارغة</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/30 text-[10px] uppercase">
              <TableRow>
                <TableHead>الصنف</TableHead>
                <TableHead className="text-center">الكمية</TableHead>
                <TableHead className="text-left">السعر</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className="group">
                  <TableCell className="py-2">
                    <div className="font-medium text-sm leading-tight">{item.name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{(item.qty * item.sale_price).toFixed(2)}</div>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center justify-center gap-1">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="size-7"
                        onClick={() => onUpdateQty(item.id, -1)}
                      >
                        <Minus className="size-3" />
                      </Button>
                      <Input 
                        className="size-8 p-0 text-center text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={item.qty}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val > 0) onSetQty(item.id, val);
                        }}
                      />
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="size-7"
                        onClick={() => onUpdateQty(item.id, 1)}
                      >
                        <Plus className="size-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 text-left font-mono text-sm">
                    {item.sale_price.toFixed(2)}
                  </TableCell>
                  <TableCell className="py-2 text-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemove(item.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ScrollArea>

      <div className="p-4 border-t bg-muted/10 space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">المجموع الفرعي</span>
          <span className="font-mono">{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-xl font-black">
          <span>الإجمالي</span>
          <span className="font-mono text-primary">{subtotal.toFixed(2)}</span>
        </div>
      </div>
    </Card>
  );
}

import { CardHeader, CardTitle } from "@/components/ui/card";
