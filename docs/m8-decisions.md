# M8: ترحيل البيانات - القرارات والتخطيط

> هذا الملف يوثق القرارات المتخذة للمرحلة الثامنة (Migration) وتصميم نظام الترحيل الآمن.

## 1) استراتيجية الترحيل
- **إعادة البناء (Re-construction)**: سنقوم بنقل المستندات الأساسية (Sales, Purchases, Payments, Expenses) ثم نترك النظام الجديد يعيد بناء دفاتر الحركات (Ledgers) تلقائياً لضمان سلامة البنية الجديدة.
- **التتبع (Tracking)**: كل سجل مرحل سيحمل `legacy_id` و `migration_batch_id`.
- **منع التكرار**: استخدام `(legacy_table, legacy_id)` كقيد فريد منطقي لمنع الاستيراد المزدوج.
- **تاريخ المعاملة**: الاعتماد على `transaction_date` التاريخي وليس تاريخ الترحيل.

## 2) مخطط قاعدة البيانات للترحيل
سنقوم بإنشاء الجداول التالية لدعم العملية:
- `migration_batches`: تتبع محاولات الترحيل (البداية، النهاية، الحالة، الإحصائيات).
- تحديث الجداول الحالية لإضافة `legacy_table` و `migrated_at` (تمت إضافة `legacy_id` مسبقاً).

## 3) ترتيب الترحيل (Order of Execution)
1. `categories`
2. `products` (مع رفع الصور لـ Storage الجديد)
3. `customers` & `suppliers`
4. `opening_balances`
5. `purchases` & `purchase_items`
6. `sales` & `sale_items`
7. `payments`
8. `expenses`
9. `sale_returns` & `purchase_returns`

## 4) الفحص والمطابقة (Reconciliation)
بعد النقل، سيتم إجراء مقارنة بين:
- **المخزون**: `legacy_stored_quantity` (من النظام القديم) مقابل الرصيد المحسوب من الحركات الجديدة.
- **أرصدة الأطراف**: `legacy_stored_balance` مقابل الرصيد الختامي في كشف الحساب الجديد.
- **الخزينة**: مطابقة إجمالي المقبوضات والمدفوعات.

## 5) مركز مراجعة الترحيل (/migration-review)
واجهة Read-Only تعرض:
- السجلات التي فشلت في التحقق (Invalid).
- السجلات اليتيمة (Orphans).
- فروقات الأرصدة (Balance Inconsistencies).
- الفواتير المكررة المحتملة.
