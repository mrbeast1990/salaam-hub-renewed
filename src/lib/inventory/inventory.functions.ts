import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export const getProductMovements = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z.object({
      product_id: z.string(),
      from_date: z.string().optional(),
      to_date: z.string().optional(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    let query = supabase
      .from("inventory_movements")
      .select("*")
      .eq("product_id", data.product_id)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (data.from_date) query = query.gte("transaction_date", data.from_date);
    if (data.to_date) query = query.lte("transaction_date", data.to_date);

    const { data: movements, error } = await query;
    if (error) throw error;

    return movements;
  });