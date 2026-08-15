import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

/**
 * دالة استرجاع بيانات فواتير الشراء مع الفلترة
 */
export const getPurchases = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z
      .object({
        search: z.string().optional(),
        supplier_id: z.string().optional(),
        status: z.enum(["draft", "posted", "cancelled"]).optional(),
        from_date: z.string().optional(),
        to_date: z.string().optional(),
        payment_method: z.string().optional(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    let query = supabase
      .from("purchases")
      .select("*, suppliers(name, phone)")
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (data.search) {
      query = query.or(`doc_number.ilike.%${data.search}%,supplier_name.ilike.%${data.search}%`);
    }

    if (data.supplier_id) {
      query = query.eq("supplier_id", data.supplier_id);
    }

    if (data.status) {
      query = query.eq("status", data.status);
    }

    if (data.from_date) {
      query = query.gte("transaction_date", data.from_date);
    }

    if (data.to_date) {
      query = query.lte("transaction_date", data.to_date);
    }

    if (data.payment_method) {
      query = query.eq("payment_method", data.payment_method);
    }

    const { data: purchases, error } = await query.limit(50);
    if (error) throw error;

    return purchases;
  });

/**
 * دالة استرجاع تفاصيل فاتورة شراء محددة
 */
export const getPurchaseDetails = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { data: purchase, error: purchaseError } = await supabase
      .from("purchases")
      .select("*, suppliers(*)")
      .eq("id", data.id)
      .single();

    if (purchaseError) throw purchaseError;

    const { data: items, error: itemsError } = await supabase
      .from("purchase_items")
      .select("*")
      .eq("purchase_id", data.id);

    if (itemsError) throw itemsError;

    return { ...purchase, items };
  });

/**
 * دالة اعتماد فاتورة شراء (RPC post_purchase)
 */
export const postPurchase = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        supplier_id: z.string().nullable(),
        supplier_name: z.string().nullable(),
        transaction_date: z.string(),
        discount: z.number().default(0),
        tax: z.number().default(0),
        paid: z.number().default(0),
        payment_method: z.string().nullable(),
        notes: z.string().nullable(),
        idempotency_key: z.string(),
        items: z.array(
          z.object({
            product_id: z.string(),
            product_name: z.string(),
            qty: z.number(),
            unit_price: z.number(),
            line_discount: z.number().default(0),
          })
        ),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const { data: purchaseId, error } = await supabase.rpc("post_purchase", {
      payload: data,
    });

    if (error) throw new Error(error.message);
    return purchaseId;
  });

/**
 * دالة إلغاء فاتورة شراء (RPC cancel_document)
 */
export const cancelPurchase = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        id: z.string(),
        reason: z.string().min(1, "يجب ذكر سبب الإلغاء"),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const { error } = await supabase.rpc("cancel_document", {
      entity_id: data.id,
      entity_type: "purchase",
      reason: data.reason,
    });

    if (error) throw error;
    return { success: true };
  });
