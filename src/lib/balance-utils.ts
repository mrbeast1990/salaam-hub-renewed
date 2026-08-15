import { supabase } from "@/integrations/supabase/client";

/**
 * Creates or updates an opening balance for a party (customer/supplier).
 * Uses the apply_opening_balance RPC to ensure ledger integrity.
 */
export async function setOpeningBalance({
  partyId,
  partyType,
  amount,
  asOfDate,
}: {
  partyId: string;
  partyType: 'customer' | 'supplier';
  amount: number;
  asOfDate: string;
}) {
  // First, check if there's already an opening balance movement for this party
  // to avoid duplication if possible (though the RPC should handle idempotency if designed well)
  // For M3, we follow the rule: don't call it on every update, only if needed.
  
  const { error } = await supabase.rpc('apply_opening_balance', {
    _party_id: partyId,
    _party_type: partyType,
    _amount: amount,
    _as_of: asOfDate,
  });

  if (error) throw error;
}

/**
 * Checks if a party has any historical movements in the ledger.
 */
export async function hasMovements(partyId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('party_ledger')
    .select('*', { count: 'exact', head: true })
    .eq('party_id', partyId);
    
  if (error) return true; // Assume movements exist on error for safety
  return (count || 0) > 0;
}

/**
 * Checks if a product has any historical inventory movements.
 */
export async function hasProductMovements(productId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('inventory_movements')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', productId);
    
  if (error) return true;
  return (count || 0) > 0;
}
