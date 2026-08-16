import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getMigrationBatches = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("migration_batches")
      .select("*")
      .order("started_at", { ascending: false });
    
    if (error) throw error;
    return data;
  });

export const getMigrationStats = createServerFn({ method: "GET" })
  .handler(async () => {
    const tables = [
      "products", "categories", "customers", "suppliers", 
      "sales", "purchases", "payments", "expenses", 
      "sale_returns", "purchase_returns"
    ];

    const stats: Record<string, { total: number; migrated: number }> = {};

    for (const table of tables) {
      const { count: total } = await supabaseAdmin
        .from(table as any)
        .select("*", { count: "exact", head: true });
      
      const { count: migrated } = await supabaseAdmin
        .from(table as any)
        .select("*", { count: "exact", head: true })
        .not("legacy_id", "is", null);
      
      stats[table] = { total: total || 0, migrated: migrated || 0 };
    }

    return stats;
  });
