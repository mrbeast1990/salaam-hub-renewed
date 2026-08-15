import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Filter,
  Calendar,
  CreditCard,
  DollarSign,
  XCircle,
  AlertTriangle,
  FileText
} from "lucide-react";
import { useState, useMemo } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { postExpense, cancelExpense } from "@/lib/expenses/expenses.functions";
import { v4 as uuidv4 } from "uuid";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const expenseSchema = z.object({
  category: z.string().min(1, "التصنيف مطلوب"),
  amount: z.number().min(0.01, "المبلغ يجب أن يكون أكبر من 0"),
  transaction_date: z.string(),
  method: z.string(),
  notes: z.string().nullable(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export const Route = createFileRoute("/_authenticated/expenses")({
  head: () => ({
    meta: [{ title: "المصروفات — سلام" }],
  }),
  component: ExpensesPage,
});

function ExpensesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCancelAlertOpen, setIsCancelAlertOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(uuidv4());
  
  const queryClient = useQueryClient();

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: "",
      amount: 0,
      transaction_date: new Date().toISOString().split("T")[0],
      method: "cash",
      notes: "",
    },
  });

  const {
    data: expenses,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["expenses", search, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("expenses")
        .select("*")
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (search) {
        query = query.or(`doc_number.ilike.%${search}%,notes.ilike.%${search}%,category.ilike.%${search}%`);
      }

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as any);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: (values: ExpenseFormValues) => postExpense({ data: { ...values, idempotency_key: idempotencyKey } }),
    onSuccess: () => {
      toast.success("تم تسجيل المصروف بنجاح");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setIsAddOpen(false);
      form.reset();
      setIdempotencyKey(uuidv4());
    },
    onError: (error: any) => {
      toast.error(error.message || "فشل تسجيل المصروف");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelExpense({ data: { id: selectedExpenseId!, reason: cancelReason } }),
    onSuccess: () => {
      toast.success("تم إلغاء المصروف بنجاح");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setIsCancelAlertOpen(false);
      setCancelReason("");
      setSelectedExpenseId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "فشل إلغاء المصروف");
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "posted":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none font-normal">معتمد</Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="font-normal">ملغى</Badge>;
      default:
        return <Badge variant="secondary" className="font-normal">{status}</Badge>;
    }
  };

  const totals = useMemo(() => {
    if (!expenses) return { total: 0, count: 0 };
    return expenses
      .filter(e => e.status === 'posted')
      .reduce((acc, curr) => ({
        total: acc.total + curr.amount,
        count: acc.count + 1
      }), { total: 0, count: 0 });
  }, [expenses]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="المصروفات"
        action={
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="size-4 ml-2" />
            تسجيل مصروف
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <DollarSign className="size-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">إجمالي المصروفات المعتمدة</div>
              <div className="text-xl font-bold font-mono">{totals.total.toFixed(2)}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <FileText className="size-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">عدد الحركات</div>
              <div className="text-xl font-bold font-mono">{totals.count}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="بحث في المصروفات..."
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
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto border rounded-md">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[120px]">رقم السند</TableHead>
                  <TableHead className="w-[120px]">التاريخ</TableHead>
                  <TableHead>التصنيف</TableHead>
                  <TableHead>ملاحظات</TableHead>
                  <TableHead className="text-left">المبلغ</TableHead>
                  <TableHead className="text-center w-[100px]">الحالة</TableHead>
                  <TableHead className="text-left w-[80px]">الإجراءات</TableHead>
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
                      فشل تحميل المصروفات
                    </TableCell>
                  </TableRow>
                ) : expenses?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      لا توجد مصروفات مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses?.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-mono font-medium">{expense.doc_number}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(expense.transaction_date), "yyyy-MM-dd", { locale: ar })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">{expense.category}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {expense.notes}
                      </TableCell>
                      <TableCell className="text-left font-bold tabular-nums">
                        {expense.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(expense.status)}
                      </TableCell>
                      <TableCell className="text-left">
                        {expense.status === 'posted' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-8 text-destructive"
                            onClick={() => {
                              setSelectedExpenseId(expense.id);
                              setIsCancelAlertOpen(true);
                            }}
                            title="إلغاء"
                          >
                            <XCircle className="size-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تسجيل مصروف جديد</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((v) => addMutation.mutate(v))} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>التصنيف *</Label>
                <Select onValueChange={(v) => form.setValue("category", v)} defaultValue={form.getValues("category")}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر تصنيفاً" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="رواتب">رواتب</SelectItem>
                    <SelectItem value="إيجار">إيجار</SelectItem>
                    <SelectItem value="كهرباء ومياه">كهرباء ومياه</SelectItem>
                    <SelectItem value="نقل وشحن">نقل وشحن</SelectItem>
                    <SelectItem value="صيانة">صيانة</SelectItem>
                    <SelectItem value="أدوات مكتبية">أدوات مكتبية</SelectItem>
                    <SelectItem value="أخرى">أخرى</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.category && <p className="text-xs text-destructive">{form.formState.errors.category.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>المبلغ *</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00"
                  {...form.register("amount", { valueAsNumber: true })}
                />
                {form.formState.errors.amount && <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>التاريخ</Label>
                <Input type="date" {...form.register("transaction_date")} />
              </div>
              <div className="space-y-2">
                <Label>طريقة الدفع</Label>
                <Select onValueChange={(v) => form.setValue("method", v)} defaultValue={form.getValues("method")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">نقدي</SelectItem>
                    <SelectItem value="bank">بنكي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea {...form.register("notes")} rows={2} />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>إلغاء</Button>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? <Loader2 className="animate-spin size-4" /> : "حفظ المصروف"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isCancelAlertOpen} onOpenChange={setIsCancelAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>إلغاء المصروف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من إلغاء هذا المصروف؟ سيتم عكس الأثر المالي من الخزينة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-2">
            <Label>سبب الإلغاء</Label>
            <Input 
              placeholder="ذكر السبب..." 
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsCancelAlertOpen(false);
              setCancelReason("");
            }}>تراجع</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                if (!cancelReason) {
                  toast.error("يرجى ذكر سبب الإلغاء");
                  return;
                }
                cancelMutation.mutate();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={cancelMutation.isPending}
            >
              تأكيد الإلغاء
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
