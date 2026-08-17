import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Plus,
  Search,
  Eye,
  Printer,
  Filter,
  ArrowRight,
  ChevronLeft,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SaleDetails } from "@/components/sales/sale-details";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/sales")({
  head: () => ({
    meta: [{ title: "سجل المبيعات — سلام" }],
  }),
  component: SalesPage,
});

function SalesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const {
    data: sales,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["sales", search, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("sales")
        .select("*, customers(name, phone)")
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (search) {
        query = query.or(`doc_number.ilike.%${search}%,customer_name.ilike.%${search}%`);
      }

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as any);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data;
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "posted":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none font-normal">نقدي / معتمدة</Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="font-normal">ملغاة</Badge>;
      case "draft":
        return <Badge variant="outline" className="font-normal">مسودة</Badge>;
      default:
        return <Badge variant="secondary" className="font-normal">{status}</Badge>;
    }
  };

  const handleViewDetails = (id: string) => {
    setSelectedSaleId(id);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-4 pb-10">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild className="md:hidden">
          <Link to="/">
            <ArrowRight className="size-5" />
          </Link>
        </Button>
        <PageHeader
          title="سجل المبيعات"
          action={
            <Button asChild className="bg-primary text-primary-foreground">
              <Link to="/pos">
                <Plus className="size-4 ml-2" />
                فاتورة جديدة
              </Link>
            </Button>
          }
        />
      </div>

      <div className="grid gap-4">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="بحث برقم الفاتورة أو العميل..."
              className="pr-9 h-11 bg-background shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-11 md:w-40 bg-background shadow-sm">
                <Filter className="size-4 ml-2 text-muted-foreground" />
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="posted">معتمدة</SelectItem>
                <SelectItem value="cancelled">ملغاة</SelectItem>
                <SelectItem value="draft">مسودة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Mobile View: Card List */}
        <div className="grid gap-3 md:hidden">
          {isPending ? (
            <div className="flex flex-col items-center py-20">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : sales?.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground bg-background rounded-xl border border-dashed">
              لا توجد فواتير مبيعات
            </div>
          ) : (
            sales?.map((sale) => (
              <Card 
                key={sale.id} 
                className="overflow-hidden border-none shadow-sm bg-background active:scale-[0.98] transition-transform"
                onClick={() => handleViewDetails(sale.id)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-1">
                      <div className="font-mono text-sm font-bold text-primary">#{sale.doc_number}</div>
                      <div className="font-bold text-base">{sale.customer_name || "عميل نقدي"}</div>
                    </div>
                    <div className="text-left">
                      <div className="text-lg font-black text-foreground tabular-nums">{sale.total.toFixed(2)}</div>
                      <div className="text-[10px] text-muted-foreground">الإجمالي (ج.م)</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(sale.status)}
                      <span>{format(new Date(sale.transaction_date), "yyyy-MM-dd", { locale: ar })}</span>
                    </div>
                    <div className="flex items-center text-primary font-medium">
                      التفاصيل
                      <ChevronLeft className="size-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block bg-background rounded-xl border shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[120px]">رقم الفاتورة</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead className="text-left">الإجمالي</TableHead>
                <TableHead className="text-center w-[120px]">الحالة</TableHead>
                <TableHead className="text-left w-[120px]">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <Loader2 className="size-8 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : sales?.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-mono font-bold text-primary">{sale.doc_number}</TableCell>
                  <TableCell className="text-xs">
                    {format(new Date(sale.transaction_date), "yyyy-MM-dd", { locale: ar })}
                  </TableCell>
                  <TableCell className="font-medium">{sale.customer_name || "عميل نقدي"}</TableCell>
                  <TableCell className="text-left font-bold tabular-nums">{sale.total.toFixed(2)}</TableCell>
                  <TableCell className="text-center">{getStatusBadge(sale.status)}</TableCell>
                  <TableCell className="text-left">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleViewDetails(sale.id)}>
                        <Eye className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => window.open(`/api/print/sale/${sale.id}`, '_blank')}>
                        <Printer className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0 md:p-6">
          <DialogHeader className="p-4 md:p-0 border-b md:border-0">
            <DialogTitle>تفاصيل الفاتورة</DialogTitle>
          </DialogHeader>
          {selectedSaleId && (
            <SaleDetails 
              saleId={selectedSaleId} 
              onClose={() => setIsDetailsOpen(false)}
              onUpdate={() => refetch()}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
