-- Phase 1: Legacy Placeholders Management
-- Add a flag to identify legacy placeholders
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_legacy_placeholder boolean DEFAULT false;

-- Grant access (Standard block for public tables)
GRANT SELECT, INSERT, UPDATE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

-- Identify and secure the placeholders
UPDATE public.products 
SET 
  is_legacy_placeholder = true,
  active = false,
  notes = COALESCE(notes, '') || ' [Legacy Migration Placeholder]'
WHERE sku LIKE 'LEGACY_MISSING_%';

-- Add a comment for clarity
COMMENT ON COLUMN public.products.is_legacy_placeholder IS 'Identifies products created during migration as placeholders for missing records in the legacy system.';
