# Salaam Sale Hub — جرد التطبيق الحالي وخطة إعادة البناء

> مصادر التحليل:
> - مستودع GitHub: https://github.com/thepanacea10/salaam-sale-hub (فرع main، الحالة الحالية)
> - كود الواجهة: `src/pages/*`, `src/contexts/AppContext.tsx`
> - قاعدة البيانات: `supabase/migrations/*.sql` (10 جداول)
> - التطبيق المنشور: لم يُزوَّد بالرابط، فالتحليل مبني على المستودع فقط. أي فرق بين المنشور والكود يجب أن يوضحه المستخدم لاحقًا.

## 1. الصفحات الحالية والوظائف

جميع الصفحات تحت `AppLayout` محمي بتسجيل الدخول (`/login`). التوجيه عبر `react-router-dom` في `src/App.tsx`.

| المسار | الملف | الغرض الرئيسي |
|---|---|---|
| `/login` | `LoginPage.tsx` | تسجيل دخول Supabase (بريد/كلمة مرور). |
| `/` | `DashboardPage.tsx` | لوحة مؤشرات: مبيعات اليوم، الخزينة، عدد الفواتير، تنبيهات مخزون. |
| `/sales` | `SalesPage.tsx` (386 سطر) | البيع السريع، اختيار العميل، السلة، الخصم، النقد/الآجل/الجزئي، حفظ فاتورة، طباعة. مسودة محلية. |
| `/purchases` | `PurchasesPage.tsx` (585 سطر) | فواتير مشتريات، اختيار مورد، أصناف بأسعار الشراء، مسودة محلية (`purchase-draft`)، طباعة. |
| `/inventory` | `InventoryPage.tsx` (296 سطر) | إدارة الأصناف: إضافة/تعديل/حذف، رفع صورة، حد أدنى للمخزون، تاريخ صلاحية، ترتيب سحب. |
| `/customers` | `CustomersPage.tsx` (1035 سطر) | العملاء والموردون في نفس الصفحة (تبويب)، رصيد افتتاحي، كشف حساب، سدادات، ربط عميل↔مورد. |
| `/treasury` | `TreasuryPage.tsx` | حركات الخزينة، الرصيد النقدي/البنكي، مصروفات (كنوع من حركات الخزينة). |
| `/reports` | `ReportsPage.tsx` (357 سطر) | تقارير مبيعات/مشتريات/أرباح/عملاء/موردين/مخزون بمدى تاريخي. |
| `/settings` | `SettingsPage.tsx` | بيانات الشركة، الشعار، قالب الفاتورة، أرصدة افتتاحية للخزينة. |
| `/audit` | `AuditCenterPage.tsx` (422 سطر) | فحص سلامة البيانات: فواتير مكررة، سدادات يتيمة، حركات غير مرتبطة، درجات جودة لكل وحدة، إصلاحات مقترحة. |
| `/notifications` | `NotificationsPage.tsx` | تنبيهات: نواقص مخزون، صلاحيات مقاربة، ديون متأخرة. |
| `/more` | `MorePage.tsx` | قائمة روابط إضافية. |

المكونات المشتركة: `AppLayout`, `BottomNav` (نافبار سفلي للجوال)، `PageHeader`، `WorkspaceSwitcher` (سيُزال في النسخة الجديدة).

الحالة العامة: `src/contexts/AppContext.tsx` (1365 سطر) — يحمل المستخدم، workspace، وجميع عمليات CRUD وحسابات الأرصدة على العميل. مصدر رئيسي لمنطق الأعمال الحالي.

## 2. الكيانات في قاعدة البيانات الحالية

من `supabase/migrations/*.sql`:

| الجدول | الحقول الأساسية | ملاحظات مهمة للنقل |
|---|---|---|
| `products` | name, quantity, cost_price, sale_price, low_stock_threshold, expiry_date, sort_order, image_url | لا يوجد barcode/SKU/category/unit/pack_size/active. الكمية مخزنة مباشرة (ليست محسوبة من حركات). |
| `customers` | name, phone, address, opening_balance, **balance**, linked_supplier_id | `balance` مخزّن ويُحدَّث يدويًا — مصدر أخطاء رئيسي. |
| `suppliers` | name, phone, address, opening_balance, **balance**, linked_customer_id | نفس مشكلة `balance` المخزّن. |
| `sales` | invoice_number, customer_id, customer_name, total, total_cost, paid, remaining, payment_method, date, idempotency_key | `date` نصي، لا يوجد `transaction_date` منفصل عن `created_at`، لا يوجد status/cancelled_at. |
| `sale_items` | sale_id, product_id, product_name, quantity, price, cost | `quantity integer` — لا يدعم كسور. |
| `purchases` | invoice_number, supplier_id, supplier_name, total, date, idempotency_key | لا حقل `paid`/`remaining` — دفع المشتريات يمر عبر `payments` فقط. |
| `purchase_items` | purchase_id, product_id, product_name, quantity, price | نفس مشكلة `integer`. |
| `payments` | entity_id, entity_type ('customer'/'supplier'), amount, method, date, description | يشير للعميل/المورد نصيًا، لا FK صارم. |
| `treasury_movements` | type, amount, method, description, date, related_id | `related_id` ضعيف (uuid حر بدون FK) — منشأ للحركات اليتيمة. |
| `app_settings` | company_*, logo_url, opening_cash, opening_bank, invoice_template | إعدادات لكل مستخدم. |
| `workspaces` + `workspace_id` على كل الجداول | — | **سيُزال بالكامل** حسب طلب المدير الواحد. |
| `audit_runs`, `audit_findings`, `audit_repairs` | نتائج فحص مركز التدقيق. | نُبقيها كوظيفة ولكن نعيد بناءها. |

## 3. العمليات المالية والمخزنية الفعلية اليوم

- **تحديث المخزون**: يتم تعديل `products.quantity` مباشرة من كود الواجهة عند حفظ البيع/الشراء/التعديل — لا يوجد جدول حركات مخزون. (خطر رئيسي.)
- **رصيد العميل/المورد**: يُحفظ ويُعدَّل يدويًا في `balance` عند كل عملية — لا يُعاد حسابه من الحركات.
- **الخزينة**: تُنشأ حركة `treasury_movements` عند البيع النقدي/الشراء/السداد/المصروف، لكن الربط عبر `related_id` دون قيد.
- **الإلغاء**: لا يوجد حقل `status`/`cancelled_at`؛ الإلغاء اليوم = حذف السجل، مما يُتلف الحركات المرتبطة.
- **التاريخ الرجعي**: يستخدم `date` النصي كحقل واحد ولا يفصل بين تاريخ العملية وتاريخ الإدخال.
- **الدقة العددية**: `numeric` بدون scale محدّد + حسابات JS بـ `number` (float).
- **Idempotency**: أُضيف `idempotency_key` لـ sales/purchases فقط، بدون فرض `UNIQUE` واضح.

## 4. التقارير الحالية

من `ReportsPage.tsx`: مبيعات (يومي/شهري/حسب العميل)، مشتريات، الأرباح (total − total_cost)، تقرير عملاء (مدين/دائن)، موردين، مخزون (رصيد وقيمة)، حركة صنف. جميعها تُحسب على العميل من البيانات المحمَّلة عبر `AppContext`. **لن يُحذف أي تقرير** في النسخة الجديدة.

## 5. فجوات بين متطلباتك والتطبيق الحالي (تحتاج قرارًا)

الحقول/الوظائف التي ذكرتها لكنها غير موجودة اليوم:
1. Barcode، كود الصنف، التصنيف، الوحدة/حجم العبوة، تفعيل/إيقاف الصنف.
2. المرتجعات (مبيعات/مشتريات) — لا يوجد جدول مخصص.
3. التسويات والجرد — غير موجود ككيان.
4. المصروفات ككيان مستقل بتصنيفات — حاليًا مجرد نوع في `treasury_movements`.
5. حفظ مسودة/اعتماد فاتورة — مسودة محلية فقط (localStorage)، لا `status='draft'|'posted'`.
6. طرق الدفع المتعددة على فاتورة واحدة — غير مدعومة.
7. سجل تدقيق حقيقي (audit_log بقيم قبل/بعد) — غير موجود؛ ما يوجد هو مركز فحص سلامة.

هذه أضيفها في المخطط الجديد كخانات موجودة من اليوم الأول (حتى لو الواجهة أخفتها مؤقتًا) حتى لا نعيد الترحيل لاحقًا. سأعرضها عليك قبل البدء.

---

## 6. مخطط قاعدة البيانات الجديد المقترح (ملخص)

المبدأ: **الحركات مصدر الحقيقة**، جداول رأسية للمستندات + جداول حركات ذرية + عرض `views` للأرصدة.

### جداول رئيسية
- `categories` (id, name, active)
- `products` (id, sku, barcode, name, category_id, unit, pack_size, cost_price `numeric(18,3)`, sale_price `numeric(18,3)`, min_stock `numeric(18,3)`, image_url, active, created_at)
- `customers` / `suppliers` (id, name, phone, address, notes, active, created_at) — بدون `balance` مخزّن.
- `opening_balances` (party_type, party_id, amount, as_of_date) للأرصدة الافتتاحية.

### مستندات (رؤوس)
- `sales` / `purchases` / `sale_returns` / `purchase_returns`
  حقول موحّدة: id, doc_number, party_id, transaction_date (date), status (`draft`/`posted`/`cancelled`), subtotal, discount, tax, total, notes, idempotency_key **UNIQUE**, cancelled_at, cancellation_reason, created_at, updated_at.
- `*_items` (doc_id, product_id, qty `numeric(18,3)`, unit_price, unit_cost, line_discount, line_total).
- `payments` (id, party_type, party_id, direction `in`/`out`, amount, method, transaction_date, treasury_movement_id **FK**, source_doc_type, source_doc_id, notes, idempotency_key **UNIQUE**, cancelled_at).
- `expenses` (id, category, amount, method, transaction_date, notes, treasury_movement_id FK, cancelled_at).
- `inventory_adjustments` (id, transaction_date, reason, status) + `inventory_adjustment_items`.

### جداول الحركات (Ledgers) — مصدر الحقيقة
- `inventory_movements` (id, product_id, qty_delta `numeric(18,3)`, source_type, source_id, transaction_date, created_at) — كل تغيير مخزوني يمر من هنا.
- `party_ledger` (id, party_type, party_id, debit, credit, source_type, source_id, transaction_date, created_at) — لحساب أرصدة العملاء/الموردين.
- `treasury_movements` (id, direction, amount, method, source_type, source_id **NOT NULL**, transaction_date, created_at) — لا حركة دون مصدر.

### التدقيق والإصلاح
- `audit_log` (id, entity_type, entity_id, action, before jsonb, after jsonb, reason, created_at) — يكتبه تريغر على كل جدول مستندي.
- `audit_runs`/`audit_findings` كما هي وظيفيًا.

### حسابات الأرصدة
- Views: `v_product_stock`, `v_customer_balance`, `v_supplier_balance`, `v_treasury_balance` — مجاميع فوق جداول الحركات + الرصيد الافتتاحي.
- خيار materialized view لاحقًا للأداء، قابل لإعادة البناء.

### قواعد إلزامية
- كل مستند يُعتَمد عبر **دالة Postgres واحدة** (RPC) داخل معاملة تُنشئ الرأس + التفاصيل + حركات المخزون + حركة الخزينة + قيد دفتر الطرف + سجل تدقيق. فشل أي جزء = تراجع كامل.
- الإلغاء = دالة تُنشئ حركات عكسية وتضبط `status='cancelled'`، لا حذف.
- `idempotency_key UNIQUE` على كل RPC مالية.
- `numeric(18,3)` للكميات و`numeric(18,2)` للنقود؛ الحساب في SQL لا في JS.

---

## 7. مراحل التنفيذ المقترحة (قصيرة ومتتابعة)

> لن أبدأ أي مرحلة قبل موافقتك.

- **م0 — الاكتشاف والتخطيط (هذه المرحلة)**: هذا الملف + قائمة الفجوات (قسم 5). المخرجات: مصادقتك على النطاق.
- **م1 — تفعيل Lovable Cloud + المخطط الأساسي**: الجداول والـ views والـ RPCs الأساسية (بدون واجهة). اختبارات SQL لدوال الاعتماد/الإلغاء.
- **م2 — تسجيل الدخول وقالب التطبيق**: login + AppLayout + BottomNav + الإعدادات.
- **م3 — الأصناف + المخزون + التصنيفات**: صفحة `/inventory` كاملة، مع رفع الصور.
- **م4 — العملاء والموردون + الأرصدة الافتتاحية + كشوف الحساب**.
- **م5 — البيع (سريع + كامل) + الطباعة + المسودات المعتمدة**.
- **م6 — المشتريات + الطباعة**.
- **م7 — السدادات + الخزينة + المصروفات**.
- **م8 — المرتجعات + تسويات الجرد**.
- **م9 — التقارير كلها + التصدير + الطباعة**.
- **م10 — لوحة التنبيهات + مركز التدقيق الجديد + سجل التدقيق**.
- **م11 — أداة Migration (منفصلة)**: تنقل بيانات النظام القديم مع `legacy_id`/`legacy_table`/`migration_batch_id`/`migrated_at`، تحتفظ برصيدين (مخزّن قديم مقابل محسوب جديد)، وتُنتج تقرير الفروقات دون تصحيح تلقائي.
- **م12 — قبول نهائي**: تشغيل متوازٍ، مطابقة التقارير، ثم الاعتماد.

كل مرحلة تنتهي بإفريز قابل للاختبار مستقلًا، بدون كسر ما قبلها.

---

## 8. ما لن يُنقل تلقائيًا

- حقل `balance` المخزّن على العملاء/الموردين → يُعاد حسابه من الحركات.
- `products.quantity` القديمة → تُحوَّل إلى **حركة مخزون افتتاحية واحدة** بتاريخ القطع، ثم يُحسب الرصيد الجديد من الحركات فقط.
- workspaces و`workspace_id` → تُهمَل تمامًا.
- الحذف السابق للفواتير → لا يمكن استرداده؛ ما نجده في القاعدة فقط سيُنقل.

---

## 9. أسئلة تحتاج قرارك قبل م1

1. الحقول الإضافية في قسم 5 (باركود، تصنيف، وحدة/عبوة، تفعيل صنف، مرتجعات، تسويات، مصروفات مصنّفة، مسودة/اعتماد، سجل تدقيق) — أضيفها كلها من البداية أم أقتصر على الموجود حاليًا؟
2. هل يوجد **رابط تطبيق منشور** لأقارن معه ما قد يكون أحدث من فرع main؟
3. طرق الدفع الفعلية عندك (نقد، بنك، شيك، تحويل…) — نفس القائمة الحالية أم تعديل؟
4. تاريخ القطع (as-of date) الذي ستُبنى عليه الأرصدة الافتتاحية عند الترحيل.
