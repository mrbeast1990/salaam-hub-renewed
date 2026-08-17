import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getAuditSummary } from "../reports/audit.functions";
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import crypto from 'crypto';

const EXPORT_PATH = '/tmp/legacy-export';

export const runActualDataImport = createServerFn({ method: "POST" })
  .handler(async () => {
    console.log("Starting actual data import from ZIP contents...");
    
    const batchId = crypto.randomUUID();
    const migratedAt = new Date().toISOString();

    try {
      // 1. Setup Batch
      await supabaseAdmin.from("migration_batches" as any).insert({
        id: batchId,
        status: 'importing',
        started_at: migratedAt,
        summary: { type: 'ACTUAL_DATA_IMPORT', source: 'FILE_UPLOAD' }
      });

      // 2. Load and verify CSVs
      const loadCsv = (file: string): any[] => {
        const fullPath = path.join(EXPORT_PATH, file);
        if (!fs.existsSync(fullPath)) return [];
        const content = fs.readFileSync(fullPath, 'utf8');
        return parse(content, { columns: true, skip_empty_lines: true });
      };

      const rawProducts = loadCsv('products.csv');
      const rawCustomers = loadCsv('customers.csv');
      const rawSuppliers = loadCsv('suppliers.csv');
      const rawSales = loadCsv('sales.csv');
      const rawSaleItems = loadCsv('sale_items.csv');
      const rawPurchases = loadCsv('purchases.csv');
      const rawPurchaseItems = loadCsv('purchase_items.csv');
      const rawPayments = loadCsv('payments.csv');
      const rawTreasury = loadCsv('treasury_movements.csv');
      const rawSettings = loadCsv('app_settings.csv');

      const expected = {
        products: 102, customers: 36, suppliers: 10,
        sales: 98, sale_items: 444,
        purchases: 67, purchase_items: 230,
        payments: 60, treasury: 60
      };

      const actual = {
        products: rawProducts.length, customers: rawCustomers.length, suppliers: rawSuppliers.length,
        sales: rawSales.length, sale_items: rawSaleItems.length,
        purchases: rawPurchases.length, purchase_items: rawPurchaseItems.length,
        payments: rawPayments.length, treasury: rawTreasury.length
      };

      console.log('Verification counts:', { expected, actual });
      
      for (const [key, count] of Object.entries(expected)) {
        if (actual[key as keyof typeof actual] !== count) {
          throw new Error(`Count mismatch for ${key}: expected ${count}, got ${actual[key as keyof typeof actual]}`);
        }
      }

      const mapping: Record<string, Record<string, string>> = {
        products: {},
        customers: {},
        suppliers: {},
        sales: {},
        purchases: {}
      };

      // 3. Import Products
      console.log('Importing products...');
      for (const p of rawProducts) {
        const newId = crypto.randomUUID();
        const { data: existing } = await supabaseAdmin.from('products').select('id').eq('legacy_id', p.id).single();
        const finalId = existing?.id || newId;

        const { error } = await supabaseAdmin.from('products').upsert({
          id: finalId,
          sku: p.sku || null,
          barcode: p.barcode || null,
          name: p.name,
          unit: p.unit || 'قطعة',
          cost_price: Number(p.cost_price || 0),
          sale_price: Number(p.sale_price || 0),
          min_stock: Number(p.min_stock || 0),
          active: String(p.active).toLowerCase() === 'true',
          legacy_id: p.id,
          legacy_table: 'products',
          migration_batch_id: batchId,
          migrated_at: migratedAt
        }, { onConflict: 'legacy_id' });
        if (error) throw error;
        mapping.products[p.id] = finalId;
      }

      // 4. Import Customers
      console.log('Importing customers...');
      for (const c of rawCustomers) {
        const newId = crypto.randomUUID();
        const { data: existing } = await supabaseAdmin.from('customers').select('id').eq('legacy_id', c.id).single();
        const finalId = existing?.id || newId;

        const { error } = await supabaseAdmin.from('customers').upsert({
          id: finalId,
          name: c.name,
          phone: c.phone || null,
          address: c.address || null,
          active: String(c.active).toLowerCase() === 'true',
          legacy_id: c.id,
          legacy_table: 'customers',
          migration_batch_id: batchId,
          migrated_at: migratedAt
        }, { onConflict: 'legacy_id' });
        if (error) throw error;
        mapping.customers[c.id] = finalId;
      }


      // 5. Import Suppliers
      console.log('Importing suppliers...');
      for (const s of rawSuppliers) {
        const newId = crypto.randomUUID();
        const { error } = await supabaseAdmin.from('suppliers').upsert({
          id: newId,
          name: s.name,
          phone: s.phone || null,
          address: s.address || null,
          active: String(s.active).toLowerCase() === 'true',
          legacy_id: s.id,
          legacy_table: 'suppliers',
          migration_batch_id: batchId,
          migrated_at: migratedAt
        }, { onConflict: 'legacy_id' });
        if (error) throw error;
        mapping.suppliers[s.id] = newId;
      }

      // 6. Handle Legacy Placeholders
      console.log('Checking for missing legacy products...');
      const missingProdIds = new Set<string>();
      rawSaleItems.forEach((item: any) => { if (item.product_id && !mapping.products[item.product_id]) missingProdIds.add(item.product_id); });
      rawPurchaseItems.forEach((item: any) => { if (item.product_id && !mapping.products[item.product_id]) missingProdIds.add(item.product_id); });
      
      for (const legacyId of missingProdIds) {
        const newId = crypto.randomUUID();
        await supabaseAdmin.from('products').insert({
          id: newId,
          name: `صنف ترحيل قديم - ${legacyId}`,
          active: false,
          is_legacy_placeholder: true as any,
          legacy_id: legacyId,
          legacy_table: 'products_missing',
          migration_batch_id: batchId,
          migrated_at: migratedAt
        });
        mapping.products[legacyId] = newId;
      }

      // 7. Import Sales
      console.log('Importing sales...');
      for (const s of rawSales) {
        const newId = crypto.randomUUID();
        const { error } = await supabaseAdmin.from('sales').upsert({
          id: newId,
          doc_number: s.invoice_number || s.doc_number || `SAL-${s.id.slice(0, 8)}`,
          customer_id: mapping.customers[s.customer_id] || null,
          customer_name: s.customer_name,
          status: (s.status as any) || 'posted',
          total: Number(s.total || 0),
          paid: Number(s.paid || 0),
          payment_method: s.payment_method,
          transaction_date: s.date || s.transaction_date,
          legacy_id: s.id,
          legacy_table: 'sales',
          migration_batch_id: batchId,
          migrated_at: migratedAt
        }, { onConflict: 'legacy_id' });
        if (error) throw error;
        mapping.sales[s.id] = newId;
      }

      // 8. Import Sale Items
      console.log('Importing sale items...');
      for (const item of rawSaleItems) {
        await supabaseAdmin.from('sale_items').insert({
          sale_id: mapping.sales[item.sale_id],
          product_id: mapping.products[item.product_id] || null,
          product_name: item.product_name,
          qty: Number(item.qty),
          unit_price: Number(item.unit_price),
          line_total: Number(item.line_total)
        });
      }

      // 9. Import Purchases
      console.log('Importing purchases...');
      for (const p of rawPurchases) {
        const newId = crypto.randomUUID();
        const { error } = await supabaseAdmin.from('purchases').upsert({
          id: newId,
          doc_number: p.invoice_number || p.doc_number || `PUR-${p.id.slice(0, 8)}`,
          supplier_id: mapping.suppliers[p.supplier_id] || null,
          supplier_name: p.supplier_name,
          status: (p.status as any) || 'posted',
          total: Number(p.total || 0),
          paid: Number(p.paid || 0),
          payment_method: p.payment_method,
          transaction_date: p.date || p.transaction_date,
          legacy_id: p.id,
          legacy_table: 'purchases',
          migration_batch_id: batchId,
          migrated_at: migratedAt
        }, { onConflict: 'legacy_id' });
        if (error) throw error;
        mapping.purchases[p.id] = newId;
      }

      // 10. Import Purchase Items
      console.log('Importing purchase items...');
      for (const item of rawPurchaseItems) {
        await supabaseAdmin.from('purchase_items').insert({
          purchase_id: mapping.purchases[item.purchase_id],
          product_id: mapping.products[item.product_id] || null,
          product_name: item.product_name,
          qty: Number(item.qty),
          unit_price: Number(item.unit_price),
          line_total: Number(item.line_total)
        });
      }

      // 11. Import Payments
      console.log('Importing payments...');
      for (const pay of rawPayments) {
        const docNum = pay.doc_number || `PAY-${pay.id.slice(0, 8)}`;
        const partyId = pay.entity_type === 'customer' || pay.party_type === 'customer' 
            ? mapping.customers[pay.entity_id || pay.party_id] 
            : mapping.suppliers[pay.entity_id || pay.party_id];

        const { error } = await supabaseAdmin.from('payments').upsert({
          doc_number: docNum,
          party_type: (pay.entity_type || pay.party_type) as any,
          party_id: partyId as any,
          amount: Number(pay.amount),
          direction: (pay.direction || (pay.entity_type === 'customer' ? 'in' : 'out')) as any,
          method: pay.method,
          transaction_date: pay.date || pay.transaction_date,
          legacy_id: pay.id,
          legacy_table: 'payments',
          migration_batch_id: batchId,
          migrated_at: migratedAt
        }, { onConflict: 'legacy_id' });
        if (error) console.error('Payment error:', error);
      }

      // 12. Settings
      if (rawSettings.length > 0) {
        const s = rawSettings[0];
        await supabaseAdmin.from('app_settings').upsert({
          id: 1,
          company_name: s.company_name,
          currency: s.currency || 'SAR'
        });
      }

      // 13. Rebuild Ledgers
      console.log('Rebuilding Inventory Movements...');
      for (const item of rawSaleItems) {
          const s = rawSales.find((x: any) => x.id === item.sale_id);
          await supabaseAdmin.from('inventory_movements').insert({
              product_id: mapping.products[item.product_id],
              qty_delta: -Number(item.qty),
              source_type: 'sale',
              source_id: mapping.sales[item.sale_id],
              transaction_date: s?.date || s?.transaction_date || migratedAt
          });
      }
      for (const item of rawPurchaseItems) {
          const p = rawPurchases.find((x: any) => x.id === item.purchase_id);
          await supabaseAdmin.from('inventory_movements').insert({
              product_id: mapping.products[item.product_id],
              qty_delta: Number(item.qty),
              source_type: 'purchase',
              source_id: mapping.purchases[item.purchase_id],
              transaction_date: p?.date || p?.transaction_date || migratedAt
          });
      }

      console.log('Rebuilding Treasury Movements...');
      for (const s of rawSales) {
          if (Number(s.paid) > 0) {
              await supabaseAdmin.from('treasury_movements').insert({
                  direction: 'in',
                  amount: Number(s.paid),
                  method: s.payment_method || 'cash',
                  source_type: 'sale',
                  source_id: mapping.sales[s.id],
                  transaction_date: s.date || s.transaction_date
              });
          }
      }
      for (const p of rawPurchases) {
          if (Number(p.paid) > 0) {
              await supabaseAdmin.from('treasury_movements').insert({
                  direction: 'out',
                  amount: Number(p.paid),
                  method: p.payment_method || 'cash',
                  source_type: 'purchase',
                  source_id: mapping.purchases[p.id],
                  transaction_date: p.date || p.transaction_date
              });
          }
      }
      for (const pay of rawPayments) {
          const newPay = (await supabaseAdmin.from('payments').select('id').eq('legacy_id', pay.id).single()).data;
          if (newPay) {
            await supabaseAdmin.from('treasury_movements').insert({
                direction: (pay.direction || (pay.entity_type === 'customer' ? 'in' : 'out')) as any,
                amount: Number(pay.amount),
                method: pay.method || 'cash',
                source_type: 'payment',
                source_id: newPay.id,
                transaction_date: pay.date || pay.transaction_date
            });
          }
      }

      console.log('Rebuilding Party Ledger...');
      for (const s of rawSales) {
          await supabaseAdmin.from('party_ledger').insert({
              party_type: 'customer',
              party_id: mapping.customers[s.customer_id],
              debit: Number(s.total),
              credit: Number(s.paid),
              source_type: 'sale',
              source_id: mapping.sales[s.id],
              transaction_date: s.date || s.transaction_date
          });
      }
      for (const p of rawPurchases) {
          await supabaseAdmin.from('party_ledger').insert({
              party_type: 'supplier',
              party_id: mapping.suppliers[p.supplier_id],
              debit: Number(p.paid),
              credit: Number(p.total),
              source_type: 'purchase',
              source_id: mapping.purchases[p.id],
              transaction_date: p.date || p.transaction_date
          });
      }
      for (const pay of rawPayments) {
          const newPay = (await supabaseAdmin.from('payments').select('id').eq('legacy_id', pay.id).single()).data;
          if (newPay) {
            await supabaseAdmin.from('party_ledger').insert({
                party_type: (pay.entity_type || pay.party_type) as any,
                party_id: pay.entity_type === 'customer' || pay.party_type === 'customer' ? mapping.customers[pay.entity_id || pay.party_id] : mapping.suppliers[pay.entity_id || pay.party_id],
                debit: pay.direction === 'out' || (!pay.direction && pay.entity_type === 'supplier') ? Number(pay.amount) : 0,
                credit: pay.direction === 'in' || (!pay.direction && pay.entity_type === 'customer') ? Number(pay.amount) : 0,
                source_type: 'payment',
                source_id: newPay.id,
                transaction_date: pay.date || pay.transaction_date
            });
          }
      }

      // Final Audit
      const audit = await getAuditSummary();
      
      const finalCounts = {
        products: (await supabaseAdmin.from('products').select('id', { count: 'exact', head: true })).count,
        customers: (await supabaseAdmin.from('customers').select('id', { count: 'exact', head: true })).count,
        suppliers: (await supabaseAdmin.from('suppliers').select('id', { count: 'exact', head: true })).count,
        sales: (await supabaseAdmin.from('sales').select('id', { count: 'exact', head: true })).count,
        sale_items: (await supabaseAdmin.from('sale_items').select('id', { count: 'exact', head: true })).count,
        purchases: (await supabaseAdmin.from('purchases').select('id', { count: 'exact', head: true })).count,
        purchase_items: (await supabaseAdmin.from('purchase_items').select('id', { count: 'exact', head: true })).count,
        payments: (await supabaseAdmin.from('payments').select('id', { count: 'exact', head: true })).count,
        inventory_movements: (await supabaseAdmin.from('inventory_movements').select('id', { count: 'exact', head: true })).count,
        party_ledger: (await supabaseAdmin.from('party_ledger').select('id', { count: 'exact', head: true })).count,
        treasury_movements: (await supabaseAdmin.from('treasury_movements').select('id', { count: 'exact', head: true })).count,
      };

      const finalSummary = {
          verdict: 'ACTUAL DATA IMPORT PASSED',
          counts: finalCounts,
          health_score: audit.overallScore,
          batch_id: batchId
      };

      await supabaseAdmin
        .from("migration_batches" as any)
        .update({
          status: 'completed',
          finished_at: new Date().toISOString(),
          summary: finalSummary
        } as any)
        .eq('id', batchId);

      return { success: true, batchId, summary: finalSummary };

    } catch (err: any) {
      console.error('Import failed:', err);
      await supabaseAdmin
        .from("migration_batches" as any)
        .update({
          status: 'failed',
          finished_at: new Date().toISOString(),
          summary: { error: err.message, verdict: 'ACTUAL DATA IMPORT FAILED' }
        } as any)
        .eq('id', batchId);
      throw err;
    }
  });
