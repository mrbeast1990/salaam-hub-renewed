import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

/**
 * دالة استرجاع بيانات الفواتير مع الفلترة
 */
export const getSales = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z
      .object({
        search: z.string().optional(),
        customer_id: z.string().optional(),
        status: z.enum(["draft", "posted", "cancelled"]).optional(),
        from_date: z.string().optional(),
        to_date: z.string().optional(),
        payment_method: z.string().optional(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    let query = supabase
      .from("sales")
      .select("*, customers(name, phone)")
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (data.search) {
      // البحث برقم الفاتورة أو اسم العميل
      query = query.or(`doc_number.ilike.%${data.search}%,customer_name.ilike.%${data.search}%`);
    }

    if (data.customer_id) {
      query = query.eq("customer_id", data.customer_id);
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

    const { data: sales, error } = await query.limit(50);
    if (error) throw error;

    return sales;
  });

/**
 * دالة استرجاع تفاصيل فاتورة محددة
 */
export const getSaleDetails = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .select("*, customers(*)")
      .eq("id", data.id)
      .single();

    if (saleError) throw saleError;

    const { data: items, error: itemsError } = await supabase
      .from("sale_items")
      .select("*")
      .eq("sale_id", data.id);

    if (itemsError) throw itemsError;

    return { ...sale, items };
  });

/**
 * دالة اعتماد فاتورة بيع (RPC post_sale)
 */
export const postSale = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        customer_id: z.string().nullable(),
        customer_name: z.string().nullable(),
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
            unit_cost: z.number(),
            line_discount: z.number().default(0),
          })
        ),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    // استدعاء RPC post_sale لضمان الذرية ومنع التكرار
    const { data: saleId, error } = await supabase.rpc("post_sale", {
      payload: data,
    });

    if (error) {
      // معالجة خطأ المخزون إذا كان مخصصاً في الـ SQL
      throw new Error(error.message);
    }

    return saleId;
  });

/**
 * دالة إلغاء فاتورة (RPC cancel_document)
 */
export const cancelSale = createServerFn({ method: "POST" })
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
      entity_type: "sale",
      reason: data.reason,
    });

    if (error) throw error;
    return { success: true };
  });
