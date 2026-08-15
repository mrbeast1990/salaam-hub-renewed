import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

/**
 * دالة جلب كشف الحساب من حركات Ledger
 */
export const getAccountStatement = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z.object({
      party_id: z.string(),
      from_date: z.string().optional(),
      to_date: z.string().optional(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    // 1. Get party type first to know how to calculate running balance accurately
    const { data: customer } = await supabase.from('customers').select('id, name').eq('id', data.party_id).single();
    const partyType = customer ? 'customer' : 'supplier';

    // 2. Fetch all movements
    const { data: ledger, error } = await supabase
      .from("party_ledger")
      .select("*")
      .eq("party_id", data.party_id)
      .order("transaction_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;

    // 3. Compute running balance from the very beginning (0 + opening balance movement)
    let runningBalance = 0;
    const allMovements = ledger.map(move => {
      // For a customer: debit increases their debt, credit reduces it
      // For a supplier: credit increases our debt to them, debit reduces it
      // But based on M1 views: (ob.amount + SUM(l.debit - l.credit))
      // This means debit is ALWAYS positive for balance and credit is ALWAYS negative
      runningBalance += (Number(move.debit) - Number(move.credit));
      return {
        ...move,
        running_balance: runningBalance
      };
    });

    let filtered = allMovements;
    let openingBalance = 0;
    
    if (data.from_date) {
      const fromDate = new Date(data.from_date);
      // Movements before the start date define the 'Opening Balance' for this period
      const preMovements = allMovements.filter(m => new Date(m.transaction_date) < fromDate);
      openingBalance = preMovements.reduce((sum, m) => sum + (Number(m.debit) - Number(m.credit)), 0);
      
      filtered = allMovements.filter(m => new Date(m.transaction_date) >= fromDate);
    }

    if (data.to_date) {
      const toDate = new Date(data.to_date);
      filtered = filtered.filter(m => new Date(m.transaction_date) <= toDate);
    }

    // 4. Detailed Summary
    const totalInvoices = filtered
      .filter(m => ['sale', 'purchase'].includes(m.source_type))
      .reduce((sum, m) => sum + (partyType === 'customer' ? Number(m.debit) : Number(m.credit)), 0);
    
    const totalPayments = filtered
      .filter(m => m.source_type === 'payment')
      .reduce((sum, m) => sum + (partyType === 'customer' ? Number(m.credit) : Number(m.debit)), 0);

    const totalReturns = filtered
      .filter(m => ['sale_return', 'purchase_return'].includes(m.source_type))
      .reduce((sum, m) => sum + (partyType === 'customer' ? Number(m.credit) : Number(m.debit)), 0);
    
    return {
      movements: filtered,
      openingBalance,
      closingBalance: runningBalance,
      summary: {
        totalInvoices,
        totalPayments,
        totalReturns,
        netMovement: runningBalance - openingBalance
      }
    };
  });
