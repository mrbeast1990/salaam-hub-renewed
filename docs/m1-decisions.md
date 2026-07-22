# م1 — قرارات التنفيذ والافتراضات

> هذا الملف يوثق ما تم في المرحلة 1 (البنية الأساسية) والقرارات التقنية المتخذة بناءً على تفويض المدير.

## 1) ما تم تنفيذه

- تفعيل Lovable Cloud (Backend المُدار).
- إنشاء مخطط قاعدة البيانات الكامل: كيانات مرجعية + مستندات + دفاتر حركات + سجل تدقيق + عروض حساب الأرصدة.
- كتابة دوال Postgres (RPCs) ذرية لاعتماد المستندات (بيع، مشتريات، سداد، مصروف) ودالة إلغاء عامة تُنشئ حركات عكسية بدون حذف.
- تشغيل اختبار دخاني SQL يغطي: البيع، التحقق من المخزون/الرصيد/الخزينة، Idempotency، الإلغاء والعكس، السداد، المصروف. **جميع الاختبارات نجحت.**
- الواجهة/التطبيق القديم لم يُعدَّل. لم يُنقل أي بيان بعد.

## 2) الجداول والدوال والعروض التي أُنشئت

### أنواع (Enums)
- `doc_status` = draft | posted | cancelled
- `party_type` = customer | supplier
- `payment_direction` = in | out
- `ledger_source_type` = sale | purchase | sale_return | purchase_return | payment | expense | inventory_adjustment | opening_balance | manual

### جداول مرجعية
- `profiles` (مرتبط بـ auth.users، ترجر إنشاء تلقائي)
- `app_settings` (سجل واحد، id=1)
- `categories`
- `products` (أُضيفت: sku, barcode, category_id, unit, pack_size, active, notes, legacy_id — كلها موجودة من اليوم الأول)
- `customers`, `suppliers` (**بدون** حقل balance مخزّن — يُحسب من الحركات)
- `opening_balances` (أرصدة افتتاحية للعملاء/الموردين)
- `doc_counters` (عدّاد أرقام المستندات لكل نوع/سنة)

### مستندات
- `sales` + `sale_items`
- `purchases` + `purchase_items`
- `sale_returns` + `sale_return_items`
- `purchase_returns` + `purchase_return_items`
- `payments`
- `expenses`
- `inventory_adjustments` + `inventory_adjustment_items`

كل مستند يحوي: `doc_number` (فريد)، `status`، `transaction_date` منفصل عن `created_at`، `idempotency_key` (UNIQUE)، `cancelled_at`/`cancellation_reason`/`cancelled_by`، `legacy_id` للترحيل، `created_by`.

### جداول الحركات (Ledgers) — مصدر الحقيقة
- `inventory_movements` — أي تغيير مخزوني (qty_delta موجب/سالب)
- `party_ledger` — كل حركة دين على العميل/المورد (debit/credit)
- `treasury_movements` — كل حركة نقدية (in/out بطريقة الدفع)

جميعها تحمل `source_type` + `source_id` (**مطلوب**، لا حركات يتيمة). للقراءة عبر RLS، للكتابة عبر RPCs فقط (SECURITY DEFINER).

### التدقيق
- `audit_log` — يسجل كل عملية post/cancel مع before/after وjsonb.
- `audit_runs`, `audit_findings` — نتائج مركز التدقيق (م10).

### العروض (Views) — بحساب لحظي
- `v_product_stock` — رصيد كل صنف من الحركات
- `v_customer_balance` — الرصيد الافتتاحي + حاصل debit-credit
- `v_supplier_balance` — نفس المنطق
- `v_treasury_balance` — حسب طريقة الدفع

كلها `security_invoker = true` — تحترم RLS للمستخدم الطالب.

### دوال RPC (كلها SECURITY DEFINER + تتطلب auth.uid())
- `next_doc_number(scope, prefix)` — يولد أرقام فريدة تسلسلية سنوية.
- `post_sale(payload jsonb)` — يعتمد فاتورة بيع بشكل ذري: رأس + بنود + حركة مخزون لكل بند + قيد الدين على العميل + حركة خزينة للمبلغ المدفوع + قيد تدقيق. يحترم Idempotency ويعيد نفس المعرّف إذا تكرر المفتاح.
- `post_purchase(payload)` — نفس المنطق للمشتريات.
- `post_payment(payload)` — سداد عميل/مورد داخل/خارج.
- `post_expense(payload)` — مصروف يخصم من الخزينة.
- `cancel_document(entity_type, entity_id, reason)` — يُنشئ حركات عكسية في الجداول الثلاثة ويضبط `status='cancelled'`. **لا يحذف السجل الأصلي.**
- `apply_opening_balance(party_type, party_id, amount, as_of)` — لضبط الأرصدة الافتتاحية.

مرتجعات المبيعات/المشتريات وتسويات الجرد: الجداول جاهزة، دوال الاعتماد الخاصة بها تُبنى في المراحل اللاحقة (م8) لأن استخدامها متوقف على وجود واجهة.

## 3) نتائج الاختبار

اختبار دخاني واحد في SQL DO block (ضمن معاملة):

| الخطوة | المتوقع | الفعلي |
|---|---|---|
| بيع 3×10 مع دفع 20 | مخزون=-3، رصيد عميل=10، خزينة=20 | ✅ |
| استدعاء `post_sale` بنفس idempotency_key | يعيد نفس المعرّف بدون تكرار | ✅ |
| `cancel_document('sale', ...)` | مخزون=0، عميل=0، خزينة=0 | ✅ |
| إلغاء الملغى مجددًا | يفشل | ✅ |
| `post_payment` عميل نقدي 10 | رصيد العميل=-10 | ✅ |
| `post_expense` 50 | خزينة تصبح -40 | ✅ |

مدقق Supabase الأمني: **0 أخطاء**. 38 تحذيرًا من نوع "RLS Policy Always True" — مقصود ومقبول (انظر القرار 5).

## 4) القرارات التقنية

1. **نموذج المستخدم**: مدير واحد. لم يُنشأ نظام أدوار الآن — يُضاف عند الحاجة الفعلية. جدول `profiles` جاهز.
2. **RLS**: كل الجداول محمية بـ RLS. القراءة/الكتابة تتطلب فقط `authenticated` (`USING (true)`). جداول الحركات للقراءة فقط عبر RLS؛ الكتابة حصريًا من داخل الـ RPCs.
3. **الأرصدة**: لا حقل `balance` مخزَّن على العملاء/الموردين ولا `quantity` مخزَّنة على `products`. كل شيء يُحسب من العروض المبنية على الحركات + الرصيد الافتتاحي.
4. **الإلغاء**: لا يوجد `DELETE` على مستندات معتمدة. الإلغاء عبر `cancel_document` الذي ينشئ حركات عكسية ويضبط الحالة إلى `cancelled`.
5. **التحذير "USING(true)"**: مقبول للنموذج ذي المستخدم الواحد. عند إضافة موظفين لاحقًا، ستُضيَّق السياسات لكل جدول.
6. **العملة الافتراضية**: `SAR` (قابلة للتعديل من `app_settings`).
7. **طرق الدفع**: نص حر (`text`) في `payment_method`/`method`. البذور الافتراضية ستُضاف في م2 (الإعدادات).
8. **الدقة**: `numeric(18,3)` للكميات وأسعار الوحدة، `numeric(18,2)` للنقود. الحسابات كلها في SQL داخل الـ RPCs.
9. **Idempotency**: `UNIQUE` على `idempotency_key` في كل جدول مستندي. الـ RPCs تتحقق أولًا قبل الإدراج.
10. **legacy_id**: مضاف على products / customers / suppliers / sales / purchases / payments / expenses / adjustments / categories — جاهز لمرحلة النقل (م11) لحفظ المعرفات القديمة والمطابقة.
11. **created_by** على المستندات يشير إلى `auth.users` — يُملأ افتراضيًا من `auth.uid()`.
12. **`sales.paid`/`payment_method`**: مُبقى على المستند لتسهيل الطباعة والعرض، لكنه ليس مصدر الحقيقة — الحركة في `treasury_movements` هي المرجع.
13. **قوائم شحن الفواتير**: لم يُتبنّى الدفع متعدد الطرق على فاتورة واحدة الآن (المستند القديم لم يدعمه). يُضاف كجدول `sale_payments` مستقل عند الحاجة دون كسر.

## 5) القيود المعروفة (لا تعطّل م1)

- دوال `post_sale_return` / `post_purchase_return` / `post_inventory_adjustment` ليست مُنجَزة بعد — تُبنى في م8 مع واجهاتها.
- لم يُضف بعد ترجر `audit_log` تلقائي على مستوى الجدول لكل تعديل — الآن `audit_log` يُملأ من داخل الـ RPCs فقط. سيُوسَّع في م10.
- لا توجد بذور بيانات في قاعدة البيانات (أصناف، تصنيفات، عملاء…) — سيبدأ المستخدم بقاعدة فارغة أو ينتظر م11.

## 6) البرومبت المقترح للمرحلة التالية (م2)

```
ابدأ م2: تسجيل الدخول وقالب التطبيق الأساسي.

المطلوب:
- تفعيل تسجيل دخول بريد/كلمة مرور + Google (Lovable Cloud) دون تسجيل عام.
  المدير الوحيد يُنشأ يدويًا من لوحة Cloud.
- بناء التوجيه: `/auth` عامة، والباقي تحت `_authenticated`.
- بناء `AppLayout` (رأس + BottomNav للجوال + Outlet) بأسلوب مطابق قدر الإمكان
  للتطبيق القديم (نافبار سفلي بتبويبات: لوحة، مبيعات، مشتريات، مخزون، المزيد).
- صفحة `/` تعرض لوحة القيادة الحالية بمؤشرات فارغة (تُملأ بالبيانات في المراحل اللاحقة).
- صفحة `/settings` تقرأ/تكتب `app_settings` (اسم شركة، هاتف، عنوان، شعار،
  عملة، أرصدة افتتاحية للخزينة، قالب الفاتورة).

المبدأ: لا منطق أعمال في الواجهة — كل الأرصدة من العروض، كل الكتابة من الـ RPCs.
لا تعيد بناء التصميم من جديد؛ حاكِ التطبيق القديم في الترتيب والأزرار.
سجّل قراراتك في `docs/m2-decisions.md`.
```
