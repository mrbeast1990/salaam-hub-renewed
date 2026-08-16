-- Migration to ensure unique legacy IDs and detailed issue tracking
CREATE TABLE IF NOT EXISTS public.migration_issues (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id uuid REFERENCES public.migration_batches(id),
    legacy_table text NOT NULL,
    legacy_id text NOT NULL,
    issue_type text NOT NULL, -- duplicate, orphan, invalid, review
    details jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.migration_issues TO authenticated;
GRANT ALL ON public.migration_issues TO service_role;

-- Add legacy_id to all main tables if they don't exist
DO $$
BEGIN
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS legacy_id text;
    ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS legacy_id text;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS legacy_id text;
    ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS legacy_id text;
    ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS legacy_id text;
    ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS legacy_id text;
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS legacy_id text;
    ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS legacy_id text;
    ALTER TABLE public.sale_returns ADD COLUMN IF NOT EXISTS legacy_id text;
    ALTER TABLE public.purchase_returns ADD COLUMN IF NOT EXISTS legacy_id text;
END $$;

-- Create unique constraints to prevent double import
-- We use legacy_table + legacy_id as a composite unique key
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_legacy_id_key') THEN
        ALTER TABLE public.products ADD CONSTRAINT products_legacy_id_key UNIQUE (legacy_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customers_legacy_id_key') THEN
        ALTER TABLE public.customers ADD CONSTRAINT customers_legacy_id_key UNIQUE (legacy_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'suppliers_legacy_id_key') THEN
        ALTER TABLE public.suppliers ADD CONSTRAINT suppliers_legacy_id_key UNIQUE (legacy_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_legacy_id_key') THEN
        ALTER TABLE public.sales ADD CONSTRAINT sales_legacy_id_key UNIQUE (legacy_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchases_legacy_id_key') THEN
        ALTER TABLE public.purchases ADD CONSTRAINT purchases_legacy_id_key UNIQUE (legacy_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_legacy_id_key') THEN
        ALTER TABLE public.payments ADD CONSTRAINT payments_legacy_id_key UNIQUE (legacy_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'expenses_legacy_id_key') THEN
        ALTER TABLE public.expenses ADD CONSTRAINT expenses_legacy_id_key UNIQUE (legacy_id);
    END IF;
END $$;
