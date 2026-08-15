import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const getPurchasesReport = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z.object({
      from_date: z.string().optional(),
      to_date: z.string().optional(),
      supplier_id: z.string().optional(),
      status: z.enum(["posted", "cancelled"]).optional(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    let query = supabase
      .from("purchases")
      .select("*, suppliers(name)")
      .order("transaction_date", { ascending: false });

    if (data.from_date) query = query.gte("transaction_date", data.from_date);
    if (data.to_date) query = query.lte("transaction_date", data.to_date);
    if (data.supplier_id) query = query.eq("supplier_id", data.supplier_id);
    if (data.status) query = query.eq("status", data.status);

    const { data: purchases, error } = await query;
    if (error) throw error;

    const stats = {
      total: 0,
      count: 0,
      cash: 0,
      credit: 0,
      returns: 0,
    };

    purchases?.forEach(p => {
      if (p.status === 'posted') {
        stats.total += Number(p.total || 0);
        stats.count++;
        if (p.payment_method === 'cash') stats.cash += Number(p.paid || 0);
        else stats.credit += (Number(p.total || 0) - Number(p.paid || 0));
      }
    });

    return { purchases, stats };
  });
