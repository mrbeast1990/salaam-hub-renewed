CREATE TABLE IF NOT EXISTS public.migration_batches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    started_at timestamptz DEFAULT now(),
    finished_at timestamptz,
    status text DEFAULT 'running', -- running, completed, failed, dry_run
    summary jsonb DEFAULT '{}'::jsonb,
    created_by uuid REFERENCES auth.users(id)
);

GRANT SELECT, INSERT, UPDATE ON public.migration_batches TO authenticated;
GRANT ALL ON public.migration_batches TO service_role;

-- Add migrated_at and legacy_table to main tables if they don't exist
DO $$
BEGIN
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS legacy_table text;
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS migrated_at timestamptz;
    
    ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS legacy_table text;
    ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS migrated_at timestamptz;
    
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS legacy_table text;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS migrated_at timestamptz;
    
    ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS legacy_table text;
    ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS migrated_at timestamptz;
    
    ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS legacy_table text;
    ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS migrated_at timestamptz;
    
    ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS legacy_table text;
    ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS migrated_at timestamptz;
    
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS legacy_table text;
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS migrated_at timestamptz;
    
    ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS legacy_table text;
    ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS migrated_at timestamptz;
    
    ALTER TABLE public.sale_returns ADD COLUMN IF NOT EXISTS legacy_table text;
    ALTER TABLE public.sale_returns ADD COLUMN IF NOT EXISTS migrated_at timestamptz;
    
    ALTER TABLE public.purchase_returns ADD COLUMN IF NOT EXISTS legacy_table text;
    ALTER TABLE public.purchase_returns ADD COLUMN IF NOT EXISTS migrated_at timestamptz;

    -- Add migration_batch_id to all
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS migration_batch_id uuid REFERENCES public.migration_batches(id);
    ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS migration_batch_id uuid REFERENCES public.migration_batches(id);
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS migration_batch_id uuid REFERENCES public.migration_batches(id);
    ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS migration_batch_id uuid REFERENCES public.migration_batches(id);
    ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS migration_batch_id uuid REFERENCES public.migration_batches(id);
    ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS migration_batch_id uuid REFERENCES public.migration_batches(id);
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS migration_batch_id uuid REFERENCES public.migration_batches(id);
    ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS migration_batch_id uuid REFERENCES public.migration_batches(id);
    ALTER TABLE public.sale_returns ADD COLUMN IF NOT EXISTS migration_batch_id uuid REFERENCES public.migration_batches(id);
    ALTER TABLE public.purchase_returns ADD COLUMN IF NOT EXISTS migration_batch_id uuid REFERENCES public.migration_batches(id);
    
    -- Store legacy quantities and balances for comparison
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS legacy_stored_quantity numeric DEFAULT 0;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS legacy_stored_balance numeric DEFAULT 0;
    ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS legacy_stored_balance numeric DEFAULT 0;
END $$;
