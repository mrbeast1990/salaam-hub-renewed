import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { getPaymentDetails } from '@/lib/payments/payments.functions';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export const Route = createFileRoute('/api/print/payment/$paymentId')({
  component: PaymentPrintPage,
  loader: async ({ params }) => {
    const payment = await getPaymentDetails({ data: { id: params.paymentId } });
    
    const { data: settings } = await supabase
      .from('app_settings')
      .select('*')
      .single();
      
    return { payment, settings };
  }
});

function PaymentPrintPage() {
  const { payment, settings } = Route.useLoaderData();

  if (!payment) return <div>السداد غير موجود</div>;

  const isCustomer = payment.party_type === 'customer';
  const partyLabel = isCustomer ? 'العميل' : 'المورد';
  const paymentMethodLabel = {
    'cash': 'نقدي',
    'bank': 'تحويل بنكي',
    'check': 'شيك'
  }[payment.method as 'cash' | 'bank' | 'check'] || payment.method;



  return (
    <div className="p-8 max-w-2xl mx-auto bg-white rtl font-cairo" dir="rtl">
      {/* Header */}
      <div className="text-center border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold">{settings?.company_name || 'Salaam Sale Hub'}</h1>
        <p className="text-gray-600">{settings?.company_address}</p>
        <p className="text-gray-600">هاتف: {settings?.company_phone}</p>

      </div>

      <div className="text-center mb-6">
        <h2 className="text-xl font-bold border py-1 px-4 inline-block rounded">إيصال سداد</h2>
      </div>

      {/* Payment Info */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <p className="text-sm text-gray-500">رقم الإيصال</p>
          <p className="font-mono font-bold">{payment.doc_number}</p>
        </div>
        <div className="text-left">
          <p className="text-sm text-gray-500">التاريخ</p>
          <p>{format(new Date(payment.transaction_date), 'PPP', { locale: ar })}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">{partyLabel}</p>
          <p className="font-bold">{payment.party_name}</p>
        </div>
        <div className="text-left">
          <p className="text-sm text-gray-500">طريقة السداد</p>
          <p>{paymentMethodLabel}</p>
        </div>
      </div>

      {/* Amount Box */}
      <div className="border-2 border-black p-4 text-center mb-8">
        <p className="text-sm text-gray-500 mb-1">المبلغ المدفوع</p>
        <p className="text-3xl font-bold">{payment.amount.toLocaleString()} {settings?.currency || 'جنيه'}</p>
      </div>

      {/* Notes */}
      {payment.notes && (
        <div className="mb-8 p-3 bg-gray-50 border rounded">
          <p className="text-sm text-gray-500 mb-1">ملاحظات:</p>
          <p>{payment.notes}</p>
        </div>
      )}

      {/* Balances */}
      <div className="border-t pt-4 mb-12">
        <div className="flex justify-between mb-2">
          <span>الحالة:</span>
          <span className="font-bold">{payment.status === 'posted' ? 'معتمد' : 'ملغى'}</span>
        </div>
      </div>


      {/* Footer */}
      <div className="flex justify-between items-end mt-20">
        <div className="text-center w-32">
          <p className="border-b pb-8 mb-2"></p>
          <p className="text-sm">توقيع المستلم</p>
        </div>
        <div className="text-center text-[10px] text-gray-400">
          <p>طُبع في: {format(new Date(), 'yyyy-MM-dd HH:mm:ss')}</p>
        </div>
        <div className="text-center w-32">
          <p className="border-b pb-8 mb-2"></p>
          <p className="text-sm">الختم</p>
        </div>
      </div>

      {/* Print Button Script */}
      <script dangerouslySetInnerHTML={{ __html: 'window.onload = () => { if(!window.location.search.includes("noprint")) window.print(); }' }} />
    </div>
  );
}
