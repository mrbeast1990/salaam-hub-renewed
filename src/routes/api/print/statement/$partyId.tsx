import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { getAccountStatement } from '@/lib/parties/statements.functions';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export const Route = createFileRoute('/api/print/statement/$partyId')({
  component: StatementPrintPage,
  loader: async ({ params }) => {
    // We pass the object directly to getAccountStatement because it's a server function
    // In TanStack Start loader, we use the function directly.
    const statement = await getAccountStatement({ 
      data: { party_id: params.partyId } 
    });
    
    const { data: party } = await supabase
      .from('customers')
      .select('name, phone')
      .eq('id', params.partyId)
      .single();

    let finalParty = party;
    let partyType = 'customer';

    if (!party) {
      const { data: supplier } = await supabase
        .from('suppliers')
        .select('name, phone')
        .eq('id', params.partyId)
        .single();
      finalParty = supplier;
      partyType = 'supplier';
    }
      
    const { data: settings } = await supabase
      .from('app_settings')
      .select('*')
      .single();
      
    return { statement, party: finalParty, partyType, settings };
  }
});

function StatementPrintPage() {
  const { statement, party, partyType, settings } = Route.useLoaderData();

  if (!statement) return <div>لا توجد بيانات</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white rtl font-cairo" dir="rtl">
      {/* Header */}
      <div className="flex justify-between border-b-2 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{settings?.company_name || 'Salaam Sale Hub'}</h1>
          <p className="text-gray-600">{settings?.company_address}</p>
          <p className="text-gray-600">هاتف: {settings?.company_phone}</p>
        </div>
        <div className="text-left">
          <h2 className="text-xl font-bold mb-2">كشف حساب</h2>
          <p className="text-sm text-gray-500">التاريخ: {format(new Date(), 'yyyy-MM-dd')}</p>
        </div>
      </div>

      {/* Party Info */}
      <div className="mb-6 p-4 bg-gray-50 border rounded flex justify-between">
        <div>
          <p className="text-sm text-gray-500">{partyType === 'customer' ? 'العميل' : 'المورد'}:</p>
          <p className="text-lg font-bold">{party?.name}</p>
        </div>
        {party?.phone && (
          <div>
            <p className="text-sm text-gray-500">الهاتف:</p>
            <p>{party.phone}</p>
          </div>
        )}
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="border p-3 rounded text-center">
          <p className="text-xs text-gray-500">رصيد افتتاحي</p>
          <p className="font-bold">{statement.openingBalance.toLocaleString()}</p>
        </div>
        <div className="border p-3 rounded text-center">
          <p className="text-xs text-gray-500">إجمالي الفواتير</p>
          <p className="font-bold">{statement.summary.totalInvoices.toLocaleString()}</p>
        </div>
        <div className="border p-3 rounded text-center">
          <p className="text-xs text-gray-500">إجمالي المدفوعات</p>
          <p className="font-bold">{statement.summary.totalPayments.toLocaleString()}</p>
        </div>
        <div className="border p-3 rounded text-center bg-gray-900 text-white">
          <p className="text-xs text-gray-200">الرصيد الختامي</p>
          <p className="text-lg font-bold">{statement.closingBalance.toLocaleString()}</p>
        </div>
      </div>

      {/* Transactions Table */}
      <table className="w-full border-collapse mb-8 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-right">التاريخ</th>
            <th className="border p-2 text-right">البيان</th>
            <th className="border p-2 text-right">المرجع</th>
            <th className="border p-2 text-right">مدين</th>
            <th className="border p-2 text-right">دائن</th>
            <th className="border p-2 text-right">الرصيد</th>
          </tr>
        </thead>
        <tbody>
          {statement.movements.map((move, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="border p-2">{format(new Date(move.transaction_date), 'yyyy-MM-dd')}</td>
              <td className="border p-2">{move.notes || move.source_type}</td>
              <td className="border p-2 font-mono">{move.id.slice(0, 8)}</td>
              <td className="border p-2 text-red-600">{move.debit > 0 ? move.debit.toLocaleString() : '-'}</td>
              <td className="border p-2 text-green-600">{move.credit > 0 ? move.credit.toLocaleString() : '-'}</td>
              <td className="border p-2 font-bold">{move.running_balance.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer */}
      <div className="text-center text-[10px] text-gray-400 mt-20">
        <p>طُبع بواسطة Salaam Sale Hub في: {format(new Date(), 'yyyy-MM-dd HH:mm:ss')}</p>
      </div>

      <script dangerouslySetInnerHTML={{ __html: 'window.onload = () => { if(!window.location.search.includes("noprint")) window.print(); }' }} />
    </div>
  );
}
