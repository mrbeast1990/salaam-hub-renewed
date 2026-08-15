import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const getInventoryReport = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data: stock, error: stockError } = await supabase
      .from("v_product_stock")
      .select("*");
    
    if (stockError) throw stockError;

    const { data: products, error: prodError } = await supabase
      .from("products")
      .select("id, name, min_stock, cost_price, barcode, active")
      .eq("active", true);

    if (prodError) throw prodError;

    const stockMap = new Map(stock?.map(s => [s.product_id, s.on_hand]) || []);

    const report = products.map(p => ({
      ...p,
      on_hand: Number(stockMap.get(p.id) || 0),
      value: Number(stockMap.get(p.id) || 0) * Number(p.cost_price || 0)
    }));

    return {
      items: report,
      summary: {
        totalItems: report.length,
        lowStock: report.filter(i => i.on_hand <= i.min_stock).length,
        totalValue: report.reduce((a, b) => a + b.value, 0)
      }
    };
  });

export const getProductHistory = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ product_id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { data: movements, error } = await supabase
      .from("inventory_movements")
      .select("*")
      .eq("product_id", data.product_id)
      .order("transaction_date", { ascending: false });
    
    if (error) throw error;
    return movements;
  });
