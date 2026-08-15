import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const getSalesReport = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z.object({
      from_date: z.string().optional(),
      to_date: z.string().optional(),
      customer_id: z.string().optional(),
      product_id: z.string().optional(),
      status: z.enum(["posted", "cancelled"]).optional(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    let query = supabase
      .from("sales")
      .select("*, customers(name)")
      .order("transaction_date", { ascending: false });

    if (data.from_date) query = query.gte("transaction_date", data.from_date);
    if (data.to_date) query = query.lte("transaction_date", data.to_date);
    if (data.customer_id) query = query.eq("customer_id", data.customer_id);
    if (data.status) query = query.eq("status", data.status);

    const { data: sales, error } = await query;
    if (error) throw error;

    // تجميع الإحصائيات
    const stats = {
      total: 0,
      count: 0,
      cash: 0,
      credit: 0,
      discount: 0,
      returns: 0,
    };

    sales?.forEach(s => {
      if (s.status === 'posted') {
        stats.total += Number(s.total || 0);
        stats.count++;
        stats.discount += Number(s.discount || 0);
        if (s.payment_method === 'cash') stats.cash += Number(s.paid || 0);
        else stats.credit += (Number(s.total || 0) - Number(s.paid || 0));
      }
    });

    return { sales, stats };
  });

export const getProfitReport = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z.object({
      from_date: z.string().optional(),
      to_date: z.string().optional(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    let salesQuery = supabase
      .from("sales")
      .select("id, total, discount, status")
      .eq("status", "posted");

    if (data.from_date) salesQuery = salesQuery.gte("transaction_date", data.from_date);
    if (data.to_date) salesQuery = salesQuery.lte("transaction_date", data.to_date);

    const { data: sales, error: salesError } = await salesQuery;
    if (salesError) throw salesError;

    const saleIds = sales.map(s => s.id);
    const { data: items, error: itemsError } = await supabase
      .from("sale_items")
      .select("sale_id, qty, unit_price, unit_cost")
      .in("sale_id", saleIds);

    if (itemsError) throw itemsError;

    // المصروفات
    let expQuery = supabase.from("expenses").select("amount").eq("status", "posted");
    if (data.from_date) expQuery = expQuery.gte("transaction_date", data.from_date);
    if (data.to_date) expQuery = expQuery.lte("transaction_date", data.to_date);
    const { data: expenses } = await expQuery;

    const revenue = sales.reduce((a, b) => a + Number(b.total), 0);
    const cogs = items?.reduce((a, b) => a + (Number(b.qty) * Number(b.unit_cost || 0)), 0) || 0;
    const totalExpenses = expenses?.reduce((a, b) => a + Number(b.amount), 0) || 0;

    return {
      revenue,
      cogs,
      grossProfit: revenue - cogs,
      expenses: totalExpenses,
      netProfit: (revenue - cogs) - totalExpenses
    };
  });
