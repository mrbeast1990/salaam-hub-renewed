-- Ensure legacy_id and legacy_table are unique together to prevent double imports
ALTER TABLE public.products ADD CONSTRAINT products_legacy_key UNIQUE (legacy_table, legacy_id);
ALTER TABLE public.customers ADD CONSTRAINT customers_legacy_key UNIQUE (legacy_table, legacy_id);
ALTER TABLE public.suppliers ADD CONSTRAINT suppliers_legacy_key UNIQUE (legacy_table, legacy_id);
ALTER TABLE public.sales ADD CONSTRAINT sales_legacy_key UNIQUE (legacy_table, legacy_id);
ALTER TABLE public.purchases ADD CONSTRAINT purchases_legacy_key UNIQUE (legacy_table, legacy_id);
ALTER TABLE public.payments ADD CONSTRAINT payments_legacy_key UNIQUE (legacy_table, legacy_id);
ALTER TABLE public.expenses ADD CONSTRAINT expenses_legacy_key UNIQUE (legacy_table, legacy_id);

-- Add legacy_stored_balance/quantity for reconciliation if not present
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='legacy_stored_balance') THEN
    ALTER TABLE public.customers ADD COLUMN legacy_stored_balance numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='legacy_stored_balance') THEN
    ALTER TABLE public.suppliers ADD COLUMN legacy_stored_balance numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='legacy_stored_quantity') THEN
    ALTER TABLE public.products ADD COLUMN legacy_stored_quantity numeric;
  END IF;
END $$;
