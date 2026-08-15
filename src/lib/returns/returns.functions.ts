import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

/**
 * دالة استرجاع سجل المرتجعات
 */
export const getReturns = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z
      .object({
        type: z.enum(["sale", "purchase"]),
        search: z.string().optional(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const table = data.type === "sale" ? "sale_returns" : "purchase_returns";
    const { data: returns, error } = await supabase
      .from(table)
      .select("*")
      .order("transaction_date", { ascending: false });

    if (error) throw error;
    return returns;
  });

/**
 * دالة اعتماد مرتجع مبيعات
 */
export const postSaleReturn = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({
      sale_id: z.string(),
      customer_id: z.string(),
      transaction_date: z.string(),
      notes: z.string().nullable(),
      idempotency_key: z.string(),
      items: z.array(z.object({
        product_id: z.string(),
        product_name: z.string(),
        qty: z.number().positive(),
        unit_price: z.number(),
      })),
      refund_amount: z.number().default(0),
      payment_method: z.string().nullable(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const { data: returnId, error } = await supabase.rpc("post_sale_return", {
      payload: data
    });

    if (error) throw new Error(error.message);
    return returnId;
  });

/**
 * دالة اعتماد مرتجع مشتريات
 */
export const postPurchaseReturn = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({
      purchase_id: z.string(),
      supplier_id: z.string(),
      transaction_date: z.string(),
      notes: z.string().nullable(),
      idempotency_key: z.string(),
      items: z.array(z.object({
        product_id: z.string(),
        product_name: z.string(),
        qty: z.number().positive(),
        unit_price: z.number(),
      })),
      refund_amount: z.number().default(0),
      payment_method: z.string().nullable(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const { data: returnId, error } = await supabase.rpc("post_purchase_return", {
      payload: data
    });

    if (error) throw new Error(error.message);
    return returnId;
  });
