# المرحلة السادسة (M6): السدادات والمرتجعات وكشوف الحساب

تنفيذ نظام السدادات (عملاء/موردين)، المرتجعات (مبيعات/مشتريات)، وكشوف الحساب التفصيلية مع ضمان الذرية المالية ومنع التكرار ودعم التاريخ الرجعي.

## 1. البنية التحتية (Backend & Functions)
- إنشاء `src/lib/payments/payments.functions.ts` للتعامل مع RPC `post_payment`.
- إنشاء `src/lib/returns/returns.functions.ts` للتعامل مع المرتجعات.
- إنشاء `src/lib/parties/statements.functions.ts` لحساب كشوف الحساب برمجياً من الحركات.
- التأكد من جاهزية RPC `post_payment` و `cancel_document` في قاعدة البيانات.

## 2. واجهات السداد (Payments UI)
- بناء صفحة `/payments` لعرض سجل السدادات.
- بناء مكون `PaymentForm` (Dialog) لدفع/تحصيل المبالغ من العملاء والموردين.
- دعم اختيار الطرف، المبلغ، التاريخ (transaction_date)، وطريقة السداد.
- تطبيق منطق `idempotency_key` ومنع النقر المتكرر.
- إنشاء صفحة طباعة إيصال السداد `/api/print/payment/$paymentId`.

## 3. واجهات المرتجعات (Returns UI)
- بناء واجهة مرتجع المبيعات:
    - اختيار الفاتورة الأصلية.
    - عرض الكميات القابلة للمرتجع.
    - التحقق من عدم تجاوز الكمية الأصلية.
    - تنفيذ RPC الذرية لزيادة المخزون وتعديل رصيد العميل.
- بناء واجهة مرتجع المشتريات (نفس المنطق بالعكس).
- دعم إلغاء المرتجع عبر `cancel_document`.

## 4. كشوف الحساب (Account Statements)
- بناء صفحة كشف حساب العميل والمورد داخل صفحة تفاصيل الطرف.
- حساب الرصيد التراكمي (Running Balance) بدءاً من 0 + حركة رصيد أول المدة.
- عرض ملخص الكشف (أول المدة، إجمالي الفواتير، المرتجعات، السدادات، الرصيد الختامي).
- إنشاء صفحة طباعة كشف حساب RTL احترافية.

## 5. الاختبارات والتحقق
- اختبار سدادات متكررة بنفس المفتاح (Idempotency).
- اختبار المرتجعات الجزئية والكلية وتأثيرها المخزني والمالي.
- التحقق من مطابقة الرصيد الختامي في الكشف مع View الأرصدة.
- اختبار الإلغاء العكسي لجميع أنواع المستندات.

## الملفات الجديدة/المعدلة:
- `src/lib/payments/payments.functions.ts`
- `src/lib/returns/returns.functions.ts`
- `src/lib/parties/statements.functions.ts`
- `src/routes/_authenticated/payments.tsx`
- `src/routes/_authenticated/returns.new.tsx`
- `src/components/payments/payment-form.tsx`
- `src/components/parties/account-statement.tsx`
- `src/routes/api/print/payment/$paymentId.tsx`
- `src/routes/api/print/statement/$partyId.tsx`
