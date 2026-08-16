import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { postSale, cancelSale } from "./sales.functions";
import { postPurchase, cancelPurchase } from "./purchases.functions";
import { postPayment, cancelPayment } from "./payments.functions";
import { getDashboardStats } from "../reports/dashboard.functions";
import { getAuditSummary } from "../reports/audit.functions";

/**
 * دالة تنفيذ الـ Smoke Test الشامل
 */
export const runSmokeTest = createServerFn({ method: "POST" })
  .handler(async () => {
    // 1. تسجيل الـ Baseline
    const baselineStats = await getDashboardStats();
    const baselineAudit = await getAuditSummary();

    const results: any[] = [];
    const timestamp = new Date().getTime();
    const idempotencyPrefix = `SMOKE_TEST_${timestamp}`;

    try {
      // 2. تجهيز بيانات اختبار (استخدام أول منتج وعميل ومورد متاح)
      const { data: products } = await supabaseAdmin.from('products').select('*').limit(1);
      const { data: customers } = await supabaseAdmin.from('customers').select('*').limit(1);
      const { data: suppliers } = await supabaseAdmin.from('suppliers').select('*').limit(1);

      if (!products?.length || !customers?.length || !suppliers?.length) {
        throw new Error("يجب توفر منتج وعميل ومورد واحد على الأقل لتشغيل الاختبار.");
      }

      const product = products[0];
      const customer = customers[0];
      const supplier = suppliers[0];

      // 3. اختبار المبيعات (نقدية)
      const salePayload = {
        customer_id: customer.id,
        customer_name: customer.name,
        transaction_date: new Date().toISOString().split('T')[0],
        items: [{
          product_id: product.id,
          product_name: product.name,
          qty: 1,
          unit_price: 100,
          unit_cost: Number(product.cost_price || 0),
          line_discount: 0
        }],
        paid: 100,
        payment_method: 'cash',
        idempotency_key: `${idempotencyPrefix}_SALE_1`
      };

      const saleId = await postSale({ data: salePayload as any });
      results.push({ step: 'Sale Creation', status: 'success', id: saleId });

      // 4. اختبار Idempotency للمبيعات (إعادة المحاولة بنفس المفتاح)
      const saleIdRetry = await postSale({ data: salePayload as any });
      if (saleId !== saleIdRetry) throw new Error("فشل اختبار Idempotency للمبيعات.");
      results.push({ step: 'Sale Idempotency', status: 'success' });

      // 5. اختبار المشتريات
      const purchasePayload = {
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        transaction_date: new Date().toISOString().split('T')[0],
        items: [{
          product_id: product.id,
          product_name: product.name,
          qty: 10,
          unit_price: 50,
          line_discount: 0
        }],
        paid: 500,
        payment_method: 'cash',
        idempotency_key: `${idempotencyPrefix}_PURCHASE_1`
      };

      const purchaseId = await postPurchase({ data: purchasePayload as any });
      results.push({ step: 'Purchase Creation', status: 'success', id: purchaseId });

      // 6. اختبار السدادات
      const paymentPayload = {
        party_id: customer.id,
        party_type: 'customer' as const,
        amount: 200,
        transaction_date: new Date().toISOString().split('T')[0],
        method: 'cash',
        idempotency_key: `${idempotencyPrefix}_PAYMENT_1`
      };

      const paymentId = await postPayment({ data: paymentPayload as any });
      results.push({ step: 'Payment Creation', status: 'success', id: paymentId });

      // 7. اختبار الإلغاء (Void) لجميع العمليات السابقة
      await cancelSale({ data: { id: saleId, reason: 'SMOKE_TEST_VOID' } });
      await cancelPurchase({ data: { id: purchaseId, reason: 'SMOKE_TEST_VOID' } });
      await cancelPayment({ data: { id: paymentId, reason: 'SMOKE_TEST_VOID' } });
      results.push({ step: 'Void Operations', status: 'success' });

      // 8. التحقق النهائي من الـ Baseline
      const finalStats = await getDashboardStats();
      const finalAudit = await getAuditSummary();

      const treasuryMatch = finalStats.balances.treasury === baselineStats.balances.treasury;
      const auditHealthMatch = finalAudit.overallScore === baselineAudit.overallScore;

      if (!treasuryMatch || !auditHealthMatch) {
        console.error("Baseline Mismatch:", {
          baselineTreasury: baselineStats.balances.treasury,
          finalTreasury: finalStats.balances.treasury,
          baselineAudit: baselineAudit.overallScore,
          finalAudit: finalAudit.overallScore
        });
        throw new Error("فشل الاختبار: الأرصدة النهائية لا تطابق الـ Baseline.");
      }

      results.push({ step: 'Baseline Reconciliation', status: 'success' });

      return {
        status: 'PRODUCTION SMOKE TEST PASSED',
        baseline: {
          treasury: baselineStats.balances.treasury,
          healthScore: baselineAudit.overallScore
        },
        final: {
          treasury: finalStats.balances.treasury,
          healthScore: finalAudit.overallScore
        },
        steps: results
      };

    } catch (error: any) {
      return {
        status: 'PRODUCTION SMOKE TEST FAILED',
        error: error.message,
        steps: results
      };
    }
  });
