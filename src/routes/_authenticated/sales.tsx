import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  XCircle,
  Filter,
  Calendar,
  CreditCard,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
    meta: [{ title: "المبيعات — سلام" }],
  }),
  component: SalesPage,
});

function SalesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const queryClient = useQueryClient();

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
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none font-normal">معتمدة</Badge>;
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
    <div className="space-y-4">
      <PageHeader
        title="سجل المبيعات"
        action={
          <Button asChild>
            <Link to="/pos">
              <Plus className="size-4 ml-2" />
              فاتورة جديدة
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="بحث برقم الفاتورة أو اسم العميل..."
                className="pr-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
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

          <div className="overflow-x-auto border rounded-md">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[120px]">رقم الفاتورة</TableHead>
                  <TableHead className="w-[120px]">التاريخ</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead className="text-left">الإجمالي</TableHead>
                  <TableHead className="text-left">المدفوع</TableHead>
                  <TableHead className="text-center w-[100px]">الحالة</TableHead>
                  <TableHead className="text-left w-[120px]">الإجراءات</TableHead>
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
                    <TableCell colSpan={7} className="text-center py-10 text-destructive">
                      فشل تحميل المبيعات
                    </TableCell>
                  </TableRow>
                ) : sales?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      لا توجد فواتير مبيعات
                    </TableCell>
                  </TableRow>
                ) : (
                  sales?.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono font-medium">{sale.doc_number}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(sale.transaction_date), "yyyy-MM-dd", { locale: ar })}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{sale.customer_name || "عميل نقدي"}</div>
                        {sale.customers?.phone && (
                          <div className="text-xs text-muted-foreground">{sale.customers.phone}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-left font-bold tabular-nums">
                        {sale.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-left tabular-nums text-muted-foreground">
                        {sale.paid.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(sale.status)}
                      </TableCell>
                      <TableCell className="text-left">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-8"
                            onClick={() => handleViewDetails(sale.id)}
                            title="عرض"
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-8"
                            onClick={() => window.open(`/api/print/sale/${sale.id}`, '_blank')}
                            title="طباعة"
                          >
                            <Printer className="size-4" />
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

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
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
