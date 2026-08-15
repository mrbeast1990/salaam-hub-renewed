import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

/**
 * دالة استرجاع سجل السدادات
 */
export const getPayments = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z
      .object({
        search: z.string().optional(),
        party_id: z.string().optional(),
        party_type: z.enum(["customer", "supplier"]).optional(),
        status: z.enum(["draft", "posted", "cancelled"]).optional(),
        from_date: z.string().optional(),
        to_date: z.string().optional(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    let query = supabase
      .from("payments")
      .select("*")
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (data.party_id) {
      query = query.eq("party_id", data.party_id);
    }
    if (data.party_type) {
      query = query.eq("party_type", data.party_type);
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

    const { data: payments, error } = await query.limit(100);
    if (error) throw error;
    return payments;
  });

/**
 * دالة تسجيل سداد جديد (RPC post_payment)
 */
export const postPayment = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        party_id: z.string(),
        party_type: z.enum(["customer", "supplier"]),
        amount: z.number().positive("يجب أن يكون المبلغ أكبر من صفر"),
        transaction_date: z.string(),
        method: z.string(),
        notes: z.string().nullable().optional(),
        idempotency_key: z.string(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    // The RPC expects 'direction', not just party_type.
    // customer -> 'in' (تحصيل)
    // supplier -> 'out' (سداد)
    const direction = data.party_type === 'customer' ? 'in' : 'out';
    
    // Get party name for the record
    const table = data.party_type === 'customer' ? 'customers' : 'suppliers';
    const { data: party } = await supabase.from(table).select('name').eq('id', data.party_id).single();

    const { data: paymentId, error } = await supabase.rpc("post_payment", {
      payload: {
        ...data,
        direction,
        party_name: party?.name || ''
      },
    });

    if (error) throw new Error(error.message);
    return paymentId;
  });

/**
 * دالة إلغاء سداد
 */
export const cancelPayment = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({
      id: z.string(),
      reason: z.string().min(1, "يجب ذكر سبب الإلغاء"),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const { error } = await supabase.rpc("cancel_document", {
      entity_id: data.id,
      entity_type: "payment",
      reason: data.reason,
    });

    if (error) throw error;
    return { success: true };
  });
