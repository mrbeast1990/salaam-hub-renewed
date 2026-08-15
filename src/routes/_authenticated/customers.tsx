import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Search, Users, UserRound, Edit2, AlertCircle, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PartyForm } from "@/components/parties/party-form";
import { AccountStatement } from "@/components/parties/account-statement";


export const Route = createFileRoute("/_authenticated/customers")({
  head: () => ({
    meta: [{ title: "العملاء والموردون — سلام" }],
  }),
  component: PartiesPage,
});

function PartiesPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"customer" | "supplier">("customer");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedParty, setSelectedParty] = useState<any>(null);
  
  const queryClient = useQueryClient();

  const { data: parties, isPending, isError, refetch } = useQuery({
    queryKey: ["parties", activeTab],
    queryFn: async () => {
      const isCustomer = activeTab === "customer";
      const table = isCustomer ? "customers" : "suppliers";
      const view = isCustomer ? "v_customer_balance" : "v_supplier_balance";
      const idField = isCustomer ? "customer_id" : "supplier_id";

      const [{ data: pData, error: pErr }, { data: bData, error: bErr }] = await Promise.all([
        supabase.from(table).select("*").order("name"),
        supabase.from(view).select(`balance, ${idField}`),
      ]);

      if (pErr) throw pErr;
      if (bErr) throw bErr;

      const balanceMap = new Map(bData.map((b: any) => [b[idField], b.balance]));

      return pData.map((p) => ({
        ...p,
        balance: balanceMap.get(p.id) || 0,
      }));
    },
  });

  const filtered = parties?.filter((p) => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (party: any) => {
    setSelectedParty(party);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedParty(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="العملاء والموردون"
        action={
          <Button onClick={handleAdd}>
            <Plus className="size-4 ml-2" />
            {activeTab === "customer" ? "إضافة عميل" : "إضافة مورد"}
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="customer" className="flex items-center gap-2">
            <Users className="size-4" />
            العملاء
          </TabsTrigger>
          <TabsTrigger value="supplier" className="flex items-center gap-2">
            <UserRound className="size-4" />
            الموردون
          </TabsTrigger>
        </TabsList>

        <div className="relative mt-4">
          <Search className="absolute right-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder={`بحث في ${activeTab === "customer" ? "العملاء" : "الموردين"} بالاسم أو الهاتف...`}
            className="pr-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم</TableHead>
                      <TableHead>الهاتف</TableHead>
                      <TableHead>العنوان</TableHead>
                      <TableHead className="text-left">الرصيد</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isPending ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10">
                          <Loader2 className="size-8 animate-spin mx-auto text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : isError ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10">
                          <div className="flex flex-col items-center gap-2">
                            <AlertCircle className="size-8 text-destructive" />
                            <p>فشل تحميل البيانات</p>
                            <Button variant="outline" size="sm" onClick={() => refetch()}>إعادة المحاولة</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filtered?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          لا توجد نتائج.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered?.map((p) => (
                        <TableRow key={p.id} className={!p.active ? "opacity-50" : ""}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell dir="ltr" className="text-right">{p.phone || "—"}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{p.address || "—"}</TableCell>
                          <TableCell className={`text-left font-bold tabular-nums ${p.balance > 0 ? 'text-destructive' : p.balance < 0 ? 'text-green-600' : ''}`}>
                            {p.balance.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-left">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
                              <Edit2 className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedParty 
                ? `بيانات ${activeTab === 'customer' ? 'العميل' : 'المورد'}: ${selectedParty.name}` 
                : `إضافة ${activeTab === 'customer' ? 'عميل' : 'مورد'} جديد`}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">البيانات الأساسية</TabsTrigger>
              <TabsTrigger value="statement" disabled={!selectedParty}>كشف الحساب</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="pt-4">
              <PartyForm 
                party={selectedParty} 
                type={activeTab}
                onSuccess={() => setIsFormOpen(false)} 
              />
            </TabsContent>
            
            <TabsContent value="statement" className="pt-4">
              {selectedParty && (
                <AccountStatement 
                  partyId={selectedParty.id} 
                  partyName={selectedParty.name} 
                />
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

    </div>
  );
}
