import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

/**
 * دالة جلب كشف الحساب من حركات Ledger
 */
export const getAccountStatement = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z.object({
      party_id: z.string(),
      from_date: z.string().optional(),
      to_date: z.string().optional(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    // 1. جلب رصيد أول المدة والحركات
    const { data: ledger, error } = await supabase
      .from("party_ledger")
      .select("*")
      .eq("party_id", data.party_id)
      .order("transaction_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;

    // 2. فلترة الحركات حسب التاريخ مع حساب الرصيد التراكمي
    let runningBalance = 0;
    const allMovements = ledger.map(move => {
      runningBalance += (Number(move.debit) - Number(move.credit));
      return {
        ...move,
        running_balance: runningBalance
      };
    });

    // 3. تطبيق فلترة التاريخ بعد حساب الرصيد التراكمي
    // لكن المتطلب يقول: "بدأ runningBalance = 0 ثم أدرج رصيد أول المدة كحركة واحدة"
    // حركة رصيد أول المدة موجودة بالفعل في party_ledger مع source_type = 'opening_balance'
    
    let filtered = allMovements;
    let openingBalance = 0;
    
    if (data.from_date) {
      const fromDate = new Date(data.from_date);
      // الرصيد الافتتاحي هو مجموع الحركات قبل التاريخ المختار
      openingBalance = allMovements
        .filter(m => new Date(m.transaction_date) < fromDate)
        .reduce((sum, m) => sum + (Number(m.debit) - Number(m.credit)), 0);
      
      filtered = allMovements.filter(m => new Date(m.transaction_date) >= fromDate);
    }

    if (data.to_date) {
      const toDate = new Date(data.to_date);
      filtered = filtered.filter(m => new Date(m.transaction_date) <= toDate);
    }

    // 4. حساب الملخص
    const totalInvoices = filtered
      .filter(m => ['sale', 'purchase'].includes(m.source_type))
      .reduce((sum, m) => sum + (Number(m.debit) || Number(m.credit)), 0); // مبسط
      
    // هذا الحساب يحتاج دقة أكبر حسب نوع الطرف (customer/supplier)
    // سنقوم بتجهيز البيانات فقط والعرض يقرر
    
    return {
      movements: filtered,
      openingBalance,
      closingBalance: runningBalance,
    };
  });
