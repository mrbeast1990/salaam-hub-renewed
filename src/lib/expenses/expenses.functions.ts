import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

/**
 * دالة استرجاع المصروفات مع الفلترة
 */
export const getExpenses = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z
      .object({
        search: z.string().optional(),
        category: z.string().optional(),
        status: z.enum(["draft", "posted", "cancelled"]).optional(),
        from_date: z.string().optional(),
        to_date: z.string().optional(),
        payment_method: z.string().optional(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    let query = supabase
      .from("expenses")
      .select("*")
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (data.search) {
      query = query.or(`doc_number.ilike.%${data.search}%,notes.ilike.%${data.search}%`);
    }

    if (data.category) {
      query = query.eq("category", data.category);
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
      query = query.eq("method", data.payment_method);
    }

    const { data: expenses, error } = await query.limit(50);
    if (error) throw error;

    return expenses;
  });

/**
 * دالة اعتماد مصروف (RPC post_expense)
 */
export const postExpense = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        category: z.string(),
        amount: z.number(),
        transaction_date: z.string(),
        method: z.string(),
        notes: z.string().nullable(),
        idempotency_key: z.string(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const { data: expenseId, error } = await supabase.rpc("post_expense", {
      payload: data,
    });

    if (error) throw new Error(error.message);
    return expenseId;
  });

/**
 * دالة إلغاء مصروف (RPC cancel_document)
 */
export const cancelExpense = createServerFn({ method: "POST" })
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
      entity_type: "expense",
      reason: data.reason,
    });

    if (error) throw error;
    return { success: true };
  });
