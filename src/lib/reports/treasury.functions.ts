import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export const getTreasuryReport = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z.object({
      from_date: z.string().optional(),
      to_date: z.string().optional(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    let query = supabase
      .from("treasury_movements")
      .select("*")
      .order("transaction_date", { ascending: true });

    if (data.from_date) query = query.gte("transaction_date", data.from_date);
    if (data.to_date) query = query.lte("transaction_date", data.to_date);

    const { data: movements, error } = await query;
    if (error) throw error;

    let balance = 0;
    
    const stats = movements?.reduce((acc, m) => {
      const amount = Number(m.amount);
      if (m.direction === 'in') {
        acc.totalIn += amount;
        balance += amount;
      } else {
        acc.totalOut += amount;
        balance -= amount;
      }
      return acc;
    }, { totalIn: 0, totalOut: 0 });

    return { movements, stats, closingBalance: balance };
  });
