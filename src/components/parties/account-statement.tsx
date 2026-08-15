import { useQuery } from "@tanstack/react-query";
import { getAccountStatement } from "@/lib/parties/statements.functions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface StatementProps {
  partyId: string;
  partyName: string;
}

export function AccountStatement({ partyId, partyName }: StatementProps) {
  const { data, isPending } = useQuery({
    queryKey: ["statement", partyId],
    queryFn: () => getAccountStatement({ data: { party_id: partyId } }),
  });

  if (isPending) {
    return <Loader2 className="animate-spin mx-auto my-10" />;
  }

  const statement = data;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">كشف حساب: {partyName}</h3>
        <Button variant="outline" size="sm" onClick={() => window.open(`/api/print/statement/${partyId}`, '_blank')}>
          <Printer className="size-4 ml-2" />
          طباعة الكشف
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-muted/50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">الرصيد الافتتاحي</p>
            <p className="text-xl font-bold tabular-nums">
              {statement?.openingBalance?.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-green-600">إجمالي مدين (عليه)</p>
            <p className="text-xl font-bold tabular-nums text-green-700">
              {statement?.movements.reduce((sum, m) => sum + Number(m.debit), 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-red-600">إجمالي دائن (له)</p>
            <p className="text-xl font-bold tabular-nums text-red-700">
              {statement?.movements.reduce((sum, m) => sum + Number(m.credit), 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-primary">الرصيد الختامي</p>
            <p className="text-xl font-bold tabular-nums text-primary">
              {statement?.closingBalance?.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>التاريخ</TableHead>
              <TableHead>نوع الحركة</TableHead>
              <TableHead>البيان</TableHead>
              <TableHead className="text-left text-green-700">مدين</TableHead>
              <TableHead className="text-left text-red-700">دائن</TableHead>
              <TableHead className="text-left font-bold">الرصيد</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {statement?.movements.map((move: any, i: number) => (
              <TableRow key={move.id} className={i % 2 === 0 ? "bg-muted/10" : ""}>
                <TableCell className="text-xs whitespace-nowrap">
                  {format(new Date(move.transaction_date), "yyyy-MM-dd")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {move.debit > 0 ? <ArrowUpRight className="size-3 text-green-600" /> : <ArrowDownLeft className="size-3 text-red-600" />}
                    <span className="text-xs">
                      {getSourceLabel(move.source_type)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-xs">
                  {move.notes || "—"}
                </TableCell>
                <TableCell className="text-left tabular-nums text-green-700">
                  {move.debit > 0 ? move.debit.toFixed(2) : "—"}
                </TableCell>
                <TableCell className="text-left tabular-nums text-red-700">
                  {move.credit > 0 ? move.credit.toFixed(2) : "—"}
                </TableCell>
                <TableCell className="text-left tabular-nums font-bold">
                  {move.running_balance.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function getSourceLabel(source: string) {
  const map: Record<string, string> = {
    sale: "فاتورة بيع",
    purchase: "فاتورة شراء",
    payment: "سند صرف/قبض",
    expense: "مصروف",
    sale_return: "مرتجع مبيعات",
    purchase_return: "مرتجع مشتريات",
    opening_balance: "رصيد أول المدة",
  };
  return map[source] || source;
}
