import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/api/print/sale/$saleId")({
  component: SalePrintPage,
});

function SalePrintPage() {
  const { saleId } = Route.useParams();

  const { data: sale, isPending, isError } = useQuery({
    queryKey: ["sale-print", saleId],
    queryFn: async () => {
      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .select("*, customers(*)")
        .eq("id", saleId)
        .single();

      if (saleError) throw saleError;

      const { data: items, error: itemsError } = await supabase
        .from("sale_items")
        .select("*")
        .eq("sale_id", saleId);

      if (itemsError) throw itemsError;

      const { data: settings } = await supabase
        .from("app_settings")
        .select("*")
        .eq("id", 1)
        .single();

      return { ...saleData, items, settings };
    },
  });

  if (isPending) return <div className="p-10 text-center">جاري التحميل للطباعة...</div>;
  if (isError || !sale) return <div className="p-10 text-center text-red-600">خطأ في تحميل الفاتورة</div>;

  return (
    <div className="bg-white text-black p-8 max-w-3xl mx-auto rtl" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 pb-6 mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900">{sale.settings?.company_name || "سلام للمبيعات"}</h1>
          <p className="text-sm text-gray-600 mt-1">{sale.settings?.company_address}</p>
          <p className="text-sm text-gray-600">{sale.settings?.company_phone}</p>
        </div>
        <div className="text-left">
          <h2 className="text-xl font-bold text-gray-800">فاتورة ضريبية مبسطة</h2>
          <p className="text-sm font-mono mt-1">#{sale.doc_number}</p>
          <p className="text-xs text-gray-500">{new Date(sale.transaction_date).toLocaleDateString('ar-EG')}</p>
        </div>
      </div>

      {/* Customer Info */}
      <div className="mb-8 grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 rounded border">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">فاتورة إلى</h3>
          <p className="font-bold">{sale.customer_name || "عميل نقدي"}</p>
          {sale.customers?.phone && <p className="text-sm">{sale.customers.phone}</p>}
        </div>
        <div className="p-3 bg-gray-50 rounded border">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">طريقة الدفع</h3>
          <p className="font-bold">{sale.payment_method || "نقدي"}</p>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-8 border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-200 text-right">
            <th className="py-3 font-bold text-gray-700">الصنف</th>
            <th className="py-3 font-bold text-gray-700 text-center">الكمية</th>
            <th className="py-3 font-bold text-gray-700 text-left">السعر</th>
            <th className="py-3 font-bold text-gray-700 text-left">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item: any) => (
            <tr key={item.id} className="border-b border-gray-100">
              <td className="py-4 font-medium">{item.product_name}</td>
              <td className="py-4 text-center">{item.qty}</td>
              <td className="py-4 text-left font-mono">{item.unit_price.toFixed(2)}</td>
              <td className="py-4 text-left font-bold font-mono">{item.line_total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>المجموع الفرعي</span>
            <span className="font-mono">{sale.subtotal.toFixed(2)}</span>
          </div>
          {sale.discount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>الخصم</span>
              <span className="font-mono">-{sale.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-black pt-2 border-t-2 border-gray-900">
            <span>الإجمالي</span>
            <span className="font-mono text-gray-900">{sale.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-700 font-bold pt-1">
            <span>المدفوع</span>
            <span className="font-mono">{sale.paid.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-500 pt-1 border-t border-dashed">
            <span>المتبقي</span>
            <span className="font-mono">{(sale.total - sale.paid).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-20 text-center border-t pt-8">
        <p className="text-gray-500 text-sm">شكراً لتعاملكم معنا!</p>
        <div className="flex justify-center mt-4">
          <Button 
            className="print:hidden" 
            onClick={() => window.print()}
          >
            اضغط للطباعة
          </Button>
        </div>
      </div>

      <style>{`
        @media print {
          body { padding: 0; margin: 0; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
