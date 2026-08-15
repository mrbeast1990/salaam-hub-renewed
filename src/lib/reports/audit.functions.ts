import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export const getAuditSummary = createServerFn({ method: "GET" })
  .handler(async () => {
    // 1. فحص سلامة المبيعات
    const { data: salesWithoutItems, error: e1 } = await supabase.rpc("check_audit_sales_no_items");
    const { data: inventoryMismatches, error: e2 } = await supabase.rpc("check_audit_inventory_mismatches");
    const { data: ledgerMismatches, error: e3 } = await supabase.rpc("check_audit_ledger_mismatches");

    if (e1 || e2 || e3) {
      console.error("Audit RPC errors:", { e1, e2, e3 });
    }

    const healthScores = {
      sales: 100,
      purchases: 100,
      inventory: 100,
      treasury: 100,
      parties: 100
    };

    // حساب درجة الصحة بشكل مبدئي بناءً على عدد المشاكل
    const findings: any[] = [
      ...(Array.isArray(salesWithoutItems) ? salesWithoutItems : []).map((f: any) => ({ ...f, severity: 'high', module: 'sales' })),
      ...(Array.isArray(inventoryMismatches) ? inventoryMismatches : []).map((f: any) => ({ ...f, severity: 'medium', module: 'inventory' })),
      ...(Array.isArray(ledgerMismatches) ? ledgerMismatches : []).map((f: any) => ({ ...f, severity: 'high', module: 'parties' }))
    ];

    if (findings.length > 0) {
      const highImpact = findings.filter(f => f.severity === 'high').length;
      healthScores.sales = Math.max(0, 100 - (highImpact * 10));
    }

    return {
      healthScores,
      overallScore: Math.min(...Object.values(healthScores)),
      findings
    };
  });
