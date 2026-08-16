import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * M8 Reconciliation Functions
 * Used to compare legacy data with the new re-constructed ledger data.
 */

export const getInventoryReconciliation = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("v_product_stock")
      .select(`
        product_id,
        name,
        stock,
        products (
          legacy_stored_quantity,
          legacy_id
        )
      `);
    
    if (error) throw error;

    return data.map((item: any) => ({
      id: item.product_id,
      name: item.name,
      calculated: item.stock,
      legacy: item.products?.legacy_stored_quantity || 0,
      diff: item.stock - (item.products?.legacy_stored_quantity || 0),
      legacy_id: item.products?.legacy_id
    }));
  });

export const getPartyReconciliation = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data: customerBalances } = await supabaseAdmin
      .from("v_customer_balance")
      .select(`
        id,
        name,
        balance,
        customers (
          legacy_stored_balance,
          legacy_id
        )
      `);

    const { data: supplierBalances } = await supabaseAdmin
      .from("v_supplier_balance")
      .select(`
        id,
        name,
        balance,
        suppliers (
          legacy_stored_balance,
          legacy_id
        )
      `);

    const customers = (customerBalances || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      type: 'customer',
      calculated: item.balance,
      legacy: item.customers?.legacy_stored_balance || 0,
      diff: item.balance - (item.customers?.legacy_stored_balance || 0),
      legacy_id: item.customers?.legacy_id
    }));

    const suppliers = (supplierBalances || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      type: 'supplier',
      calculated: item.balance,
      legacy: item.suppliers?.legacy_stored_balance || 0,
      diff: item.balance - (item.suppliers?.legacy_stored_balance || 0),
      legacy_id: item.suppliers?.legacy_id
    }));

    return [...customers, ...suppliers];
  });
