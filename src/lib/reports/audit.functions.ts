import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export const getAuditSummary = createServerFn({ method: "GET" })
  .handler(async () => {
    // 1. فحص سلامة المبيعات
    const { data: salesWithoutItems } = await supabase.rpc("check_audit_sales_no_items");
    const { data: inventoryMismatches } = await supabase.rpc("check_audit_inventory_mismatches");
    const { data: ledgerMismatches } = await supabase.rpc("check_audit_ledger_mismatches");

    // محاكاة درجات الصحة الصحية مؤقتاً حتى تكتمل الـ RPCs في قاعدة البيانات
    // سنعتمد على فحص الحركات اليتيمة أو الفوارق
    
    const healthScores = {
      sales: 100,
      purchases: 100,
      inventory: 100,
      treasury: 100,
      parties: 100
    };

    return {
      healthScores,
      overallScore: 100,
      findings: [
        ...(salesWithoutItems || []).map((f: any) => ({ ...f, severity: 'high', module: 'sales' })),
        ...(inventoryMismatches || []).map((f: any) => ({ ...f, severity: 'medium', module: 'inventory' })),
        ...(ledgerMismatches || []).map((f: any) => ({ ...f, severity: 'high', module: 'parties' }))
      ]
    };
  });
