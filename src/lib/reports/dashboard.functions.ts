import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfMonth, format } from "date-fns";

export const getDashboardStats = createServerFn({ method: "GET" })
  .handler(async () => {
    const now = new Date();
    const today = format(now, "yyyy-MM-dd");
    const yesterday = format(subDays(now, 1), "yyyy-MM-dd");
    const monthStart = format(startOfMonth(now), "yyyy-MM-dd");

    const [
      salesToday,
      salesYesterday,
      salesMonth,
      purchasesMonth,
      expensesMonth,
      treasuryBalance,
      customerDebt,
      supplierDebt,
      stockData,
      productsRes,
      recentMovements
    ] = await Promise.all([
      // مبيعات اليوم
      supabase.from("sales").select("total").eq("status", "posted").eq("transaction_date", today),
      // مبيعات أمس
      supabase.from("sales").select("total").eq("status", "posted").eq("transaction_date", yesterday),
      // مبيعات الشهر
      supabase.from("sales").select("total").eq("status", "posted").gte("transaction_date", monthStart),
      // مشتريات الشهر
      supabase.from("purchases").select("total").eq("status", "posted").gte("transaction_date", monthStart),
      // مصروفات الشهر
      supabase.from("expenses").select("amount").eq("status", "posted").gte("transaction_date", monthStart),
      // رصيد الخزينة
      supabase.from("v_treasury_balance").select("balance"),
      // مستحقات العملاء
      supabase.from("v_customer_balance").select("balance"),
      // مستحقات الموردين
      supabase.from("v_supplier_balance").select("balance"),
      // كميات المخزون
      supabase.from("v_product_stock").select("product_id, on_hand"),
      // بيانات المنتجات (لسعر الشراء والحد الأدنى)
      supabase.from("products").select("id, name, min_stock, buy_price").eq("active", true),
      // أحدث الحركات
      supabase.from("party_ledger").select("*").order("created_at", { ascending: false }).limit(5)
    ]);

    // حساب التجميعات
    const sum = (arr: any[], key: string) => arr?.reduce((a, b) => a + Number(b[key] || 0), 0) || 0;

    const stockMap = new Map(stockData.data?.map(s => [s.product_id, Number(s.on_hand)]) || []);
    
    let totalInventoryValue = 0;
    let lowStockCount = 0;

    (productsRes.data || []).forEach(p => {
      const qty = stockMap.get(p.id) || 0;
      totalInventoryValue += (qty * Number(p.buy_price || 0));
      if (qty <= (p.min_stock || 0)) {
        lowStockCount++;
      }
    });

    return {
      sales: {
        today: sum(salesToday.data || [], "total"),
        yesterday: sum(salesYesterday.data || [], "total"),
        month: sum(salesMonth.data || [], "total"),
      },
      purchases: {
        month: sum(purchasesMonth.data || [], "total"),
      },
      expenses: {
        month: sum(expensesMonth.data || [], "amount"),
      },
      balances: {
        treasury: sum(treasuryBalance.data || [], "balance"),
        receivables: (customerDebt.data || []).reduce((a, b) => a + Math.max(0, Number(b.balance)), 0),
        payables: (supplierDebt.data || []).reduce((a, b) => a + Math.max(0, Number(b.balance)), 0),
      },
      inventory: {
        totalValue: totalInventoryValue,
        lowStockCount: lowStockCount,
      },
      recentMovements: recentMovements.data || []
    };
  });
