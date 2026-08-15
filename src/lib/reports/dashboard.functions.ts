import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, subDays, startOfMonth, format } from "date-fns";

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
      inventoryValuation,
      lowStockCount,
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
      // قيمة المخزون (سعر الشراء * الكمية)
      supabase.from("v_product_stock").select("on_hand, unit_cost"),
      // الأصناف منخفضة المخزون
      supabase.from("products").select("id, name, min_stock").eq("active", true),
      // أحدث الحركات (من حركات المخزون أو Ledger)
      supabase.from("party_ledger").select("*").order("created_at", { ascending: false }).limit(5)
    ]);

    // حساب التجميعات
    const sum = (arr: any[], key: string) => arr?.reduce((a, b) => a + Number(b[key] || 0), 0) || 0;

    // جلب كميات المخزون الفعلية لمطابقتها مع min_stock
    const { data: stockData } = await supabase.from("v_product_stock").select("product_id, on_hand");
    const stockMap = new Map(stockData?.map(s => [s.product_id, Number(s.on_hand)]) || []);
    
    const lowStockItems = (lowStockCount.data || []).filter(p => {
      const qty = stockMap.get(p.id) || 0;
      return qty <= (p.min_stock || 0);
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
        totalValue: (inventoryValuation.data || []).reduce((a, b) => a + (Number(b.on_hand) * Number(b.unit_cost)), 0),
        lowStockCount: lowStockItems.length,
      },
      recentMovements: recentMovements.data || []
    };
  });
