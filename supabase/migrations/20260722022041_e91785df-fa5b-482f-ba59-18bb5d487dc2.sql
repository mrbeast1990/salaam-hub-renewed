
-- =============================================================
-- Salaam Sale Hub v2 — Milestone 1: Core Schema, Ledgers, RPCs
-- =============================================================

-- ---------- Enums ----------
CREATE TYPE public.doc_status AS ENUM ('draft', 'posted', 'cancelled');
CREATE TYPE public.party_type AS ENUM ('customer', 'supplier');
CREATE TYPE public.payment_direction AS ENUM ('in', 'out');
CREATE TYPE public.ledger_source_type AS ENUM (
  'sale', 'purchase', 'sale_return', 'purchase_return',
  'payment', 'expense', 'inventory_adjustment', 'opening_balance', 'manual'
);

-- ---------- Common trigger: updated_at ----------
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ---------- profiles ----------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read"   ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile write"  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------- app_settings (singleton) ----------
CREATE TABLE public.app_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  company_name text,
  company_phone text,
  company_address text,
  company_email text,
  logo_url text,
  currency text NOT NULL DEFAULT 'SAR',
  opening_cash numeric(18,2) NOT NULL DEFAULT 0,
  opening_bank numeric(18,2) NOT NULL DEFAULT 0,
  opening_as_of_date date NOT NULL DEFAULT CURRENT_DATE,
  invoice_template jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.app_settings (id) VALUES (1);
GRANT SELECT, INSERT, UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings authed"        ON public.app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings authed update" ON public.app_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_app_settings_updated BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ---------- categories ----------
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  legacy_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cat authed all" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ---------- products ----------
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text,
  barcode text,
  name text NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  unit text NOT NULL DEFAULT 'قطعة',
  pack_size numeric(18,3) NOT NULL DEFAULT 1,
  cost_price numeric(18,3) NOT NULL DEFAULT 0,
  sale_price numeric(18,3) NOT NULL DEFAULT 0,
  min_stock numeric(18,3) NOT NULL DEFAULT 0,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  expiry_date date,
  notes text,
  legacy_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX products_sku_uniq     ON public.products(sku)     WHERE sku IS NOT NULL;
CREATE UNIQUE INDEX products_barcode_uniq ON public.products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX products_active_idx ON public.products(active);
CREATE INDEX products_legacy_idx ON public.products(legacy_id) WHERE legacy_id IS NOT NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prod authed all" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ---------- customers ----------
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  address text,
  notes text,
  active boolean NOT NULL DEFAULT true,
  linked_supplier_id uuid,
  legacy_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX customers_legacy_idx ON public.customers(legacy_id) WHERE legacy_id IS NOT NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cust authed all" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ---------- suppliers ----------
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  address text,
  notes text,
  active boolean NOT NULL DEFAULT true,
  linked_customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  legacy_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX suppliers_legacy_idx ON public.suppliers(legacy_id) WHERE legacy_id IS NOT NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "supp authed all" ON public.suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_suppliers_updated BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

ALTER TABLE public.customers ADD CONSTRAINT customers_linked_supplier_fk
  FOREIGN KEY (linked_supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;

-- ---------- opening_balances ----------
CREATE TABLE public.opening_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_type public.party_type NOT NULL,
  party_id uuid NOT NULL,
  amount numeric(18,2) NOT NULL DEFAULT 0,   -- positive: طرف مدين لنا (عميل مدين / نحن دائنون للمورد)
  as_of_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (party_type, party_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opening_balances TO authenticated;
GRANT ALL ON public.opening_balances TO service_role;
ALTER TABLE public.opening_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ob authed all" ON public.opening_balances FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---------- Ledger tables (source of truth) ----------
CREATE TABLE public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  qty_delta numeric(18,3) NOT NULL,
  unit_cost numeric(18,3) NOT NULL DEFAULT 0,
  source_type public.ledger_source_type NOT NULL,
  source_id uuid NOT NULL,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX inv_mov_product_idx ON public.inventory_movements(product_id);
CREATE INDEX inv_mov_source_idx  ON public.inventory_movements(source_type, source_id);
CREATE INDEX inv_mov_txdate_idx  ON public.inventory_movements(transaction_date);
GRANT SELECT ON public.inventory_movements TO authenticated;
GRANT ALL ON public.inventory_movements TO service_role;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inv mov read" ON public.inventory_movements FOR SELECT TO authenticated USING (true);
-- Writes only via SECURITY DEFINER RPCs.

CREATE TABLE public.party_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_type public.party_type NOT NULL,
  party_id uuid NOT NULL,
  debit numeric(18,2) NOT NULL DEFAULT 0,
  credit numeric(18,2) NOT NULL DEFAULT 0,
  source_type public.ledger_source_type NOT NULL,
  source_id uuid NOT NULL,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (debit >= 0 AND credit >= 0)
);
CREATE INDEX party_ledger_party_idx  ON public.party_ledger(party_type, party_id);
CREATE INDEX party_ledger_source_idx ON public.party_ledger(source_type, source_id);
CREATE INDEX party_ledger_txdate_idx ON public.party_ledger(transaction_date);
GRANT SELECT ON public.party_ledger TO authenticated;
GRANT ALL ON public.party_ledger TO service_role;
ALTER TABLE public.party_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "party ledger read" ON public.party_ledger FOR SELECT TO authenticated USING (true);

CREATE TABLE public.treasury_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction public.payment_direction NOT NULL,
  amount numeric(18,2) NOT NULL CHECK (amount >= 0),
  method text NOT NULL DEFAULT 'cash',
  source_type public.ledger_source_type NOT NULL,
  source_id uuid NOT NULL,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX treas_source_idx ON public.treasury_movements(source_type, source_id);
CREATE INDEX treas_method_idx ON public.treasury_movements(method);
CREATE INDEX treas_txdate_idx ON public.treasury_movements(transaction_date);
GRANT SELECT ON public.treasury_movements TO authenticated;
GRANT ALL ON public.treasury_movements TO service_role;
ALTER TABLE public.treasury_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "treas read" ON public.treasury_movements FOR SELECT TO authenticated USING (true);

-- ---------- Document tables ----------
-- Common columns pattern: doc_number, status, dates, idempotency_key UNIQUE, cancelled_*.

CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_number text NOT NULL UNIQUE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name text,
  status public.doc_status NOT NULL DEFAULT 'posted',
  subtotal numeric(18,2) NOT NULL DEFAULT 0,
  discount numeric(18,2) NOT NULL DEFAULT 0,
  tax numeric(18,2) NOT NULL DEFAULT 0,
  total numeric(18,2) NOT NULL DEFAULT 0,
  total_cost numeric(18,2) NOT NULL DEFAULT 0,
  paid numeric(18,2) NOT NULL DEFAULT 0,
  payment_method text,
  notes text,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  idempotency_key text UNIQUE,
  cancelled_at timestamptz,
  cancellation_reason text,
  cancelled_by uuid REFERENCES auth.users(id),
  legacy_id text,
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sales_customer_idx ON public.sales(customer_id);
CREATE INDEX sales_status_idx   ON public.sales(status);
CREATE INDEX sales_txdate_idx   ON public.sales(transaction_date);
CREATE INDEX sales_legacy_idx   ON public.sales(legacy_id) WHERE legacy_id IS NOT NULL;
GRANT SELECT, INSERT, UPDATE ON public.sales TO authenticated;
GRANT ALL ON public.sales TO service_role;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales read"   ON public.sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "sales insert" ON public.sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "sales update draft" ON public.sales FOR UPDATE TO authenticated USING (status = 'draft') WITH CHECK (status = 'draft');
CREATE TRIGGER trg_sales_updated BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  qty numeric(18,3) NOT NULL CHECK (qty > 0),
  unit_price numeric(18,3) NOT NULL DEFAULT 0,
  unit_cost numeric(18,3) NOT NULL DEFAULT 0,
  line_discount numeric(18,2) NOT NULL DEFAULT 0,
  line_total numeric(18,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sale_items_sale_idx ON public.sale_items(sale_id);
CREATE INDEX sale_items_prod_idx ON public.sale_items(product_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_items TO authenticated;
GRANT ALL ON public.sale_items TO service_role;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sale items all" ON public.sale_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_number text NOT NULL UNIQUE,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_name text,
  status public.doc_status NOT NULL DEFAULT 'posted',
  subtotal numeric(18,2) NOT NULL DEFAULT 0,
  discount numeric(18,2) NOT NULL DEFAULT 0,
  tax numeric(18,2) NOT NULL DEFAULT 0,
  total numeric(18,2) NOT NULL DEFAULT 0,
  paid numeric(18,2) NOT NULL DEFAULT 0,
  payment_method text,
  notes text,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  idempotency_key text UNIQUE,
  cancelled_at timestamptz,
  cancellation_reason text,
  cancelled_by uuid REFERENCES auth.users(id),
  legacy_id text,
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX purch_supplier_idx ON public.purchases(supplier_id);
CREATE INDEX purch_status_idx   ON public.purchases(status);
CREATE INDEX purch_txdate_idx   ON public.purchases(transaction_date);
CREATE INDEX purch_legacy_idx   ON public.purchases(legacy_id) WHERE legacy_id IS NOT NULL;
GRANT SELECT, INSERT, UPDATE ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "purch read"   ON public.purchases FOR SELECT TO authenticated USING (true);
CREATE POLICY "purch insert" ON public.purchases FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "purch update draft" ON public.purchases FOR UPDATE TO authenticated USING (status = 'draft') WITH CHECK (status = 'draft');
CREATE TRIGGER trg_purchases_updated BEFORE UPDATE ON public.purchases FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.purchase_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  qty numeric(18,3) NOT NULL CHECK (qty > 0),
  unit_price numeric(18,3) NOT NULL DEFAULT 0,
  line_discount numeric(18,2) NOT NULL DEFAULT 0,
  line_total numeric(18,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX purch_items_doc_idx  ON public.purchase_items(purchase_id);
CREATE INDEX purch_items_prod_idx ON public.purchase_items(product_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_items TO authenticated;
GRANT ALL ON public.purchase_items TO service_role;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "purch items all" ON public.purchase_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- sale_returns / purchase_returns (same shape as sales/purchases but reference original doc)
CREATE TABLE public.sale_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_number text NOT NULL UNIQUE,
  original_sale_id uuid REFERENCES public.sales(id),
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name text,
  status public.doc_status NOT NULL DEFAULT 'posted',
  subtotal numeric(18,2) NOT NULL DEFAULT 0,
  total numeric(18,2) NOT NULL DEFAULT 0,
  total_cost numeric(18,2) NOT NULL DEFAULT 0,
  refunded numeric(18,2) NOT NULL DEFAULT 0,
  payment_method text,
  notes text,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  idempotency_key text UNIQUE,
  cancelled_at timestamptz,
  cancellation_reason text,
  cancelled_by uuid REFERENCES auth.users(id),
  legacy_id text,
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.sale_return_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid NOT NULL REFERENCES public.sale_returns(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  qty numeric(18,3) NOT NULL CHECK (qty > 0),
  unit_price numeric(18,3) NOT NULL DEFAULT 0,
  unit_cost numeric(18,3) NOT NULL DEFAULT 0,
  line_total numeric(18,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.sale_returns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_return_items TO authenticated;
GRANT ALL ON public.sale_returns TO service_role;
GRANT ALL ON public.sale_return_items TO service_role;
ALTER TABLE public.sale_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_return_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sret authed" ON public.sale_returns FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "sret items authed" ON public.sale_return_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_sale_returns_updated BEFORE UPDATE ON public.sale_returns FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.purchase_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_number text NOT NULL UNIQUE,
  original_purchase_id uuid REFERENCES public.purchases(id),
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_name text,
  status public.doc_status NOT NULL DEFAULT 'posted',
  subtotal numeric(18,2) NOT NULL DEFAULT 0,
  total numeric(18,2) NOT NULL DEFAULT 0,
  refunded numeric(18,2) NOT NULL DEFAULT 0,
  payment_method text,
  notes text,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  idempotency_key text UNIQUE,
  cancelled_at timestamptz,
  cancellation_reason text,
  cancelled_by uuid REFERENCES auth.users(id),
  legacy_id text,
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.purchase_return_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid NOT NULL REFERENCES public.purchase_returns(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  qty numeric(18,3) NOT NULL CHECK (qty > 0),
  unit_price numeric(18,3) NOT NULL DEFAULT 0,
  line_total numeric(18,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.purchase_returns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_return_items TO authenticated;
GRANT ALL ON public.purchase_returns, public.purchase_return_items TO service_role;
ALTER TABLE public.purchase_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_return_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pret authed" ON public.purchase_returns FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "pret items authed" ON public.purchase_return_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_purchase_returns_updated BEFORE UPDATE ON public.purchase_returns FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ---------- Payments ----------
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_number text NOT NULL UNIQUE,
  party_type public.party_type NOT NULL,
  party_id uuid NOT NULL,
  party_name text,
  direction public.payment_direction NOT NULL,
  amount numeric(18,2) NOT NULL CHECK (amount > 0),
  method text NOT NULL DEFAULT 'cash',
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  source_doc_type text,
  source_doc_id uuid,
  notes text,
  status public.doc_status NOT NULL DEFAULT 'posted',
  idempotency_key text UNIQUE,
  cancelled_at timestamptz,
  cancellation_reason text,
  cancelled_by uuid REFERENCES auth.users(id),
  legacy_id text,
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pay_party_idx ON public.payments(party_type, party_id);
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pay authed r"   ON public.payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "pay authed ins" ON public.payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "pay authed upd" ON public.payments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ---------- Expenses ----------
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_number text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT 'general',
  amount numeric(18,2) NOT NULL CHECK (amount > 0),
  method text NOT NULL DEFAULT 'cash',
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  status public.doc_status NOT NULL DEFAULT 'posted',
  idempotency_key text UNIQUE,
  cancelled_at timestamptz,
  cancellation_reason text,
  cancelled_by uuid REFERENCES auth.users(id),
  legacy_id text,
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exp authed r"   ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "exp authed ins" ON public.expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "exp authed upd" ON public.expenses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ---------- Inventory adjustments ----------
CREATE TABLE public.inventory_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_number text NOT NULL UNIQUE,
  reason text NOT NULL,
  status public.doc_status NOT NULL DEFAULT 'posted',
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  idempotency_key text UNIQUE,
  cancelled_at timestamptz,
  cancellation_reason text,
  cancelled_by uuid REFERENCES auth.users(id),
  legacy_id text,
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.inventory_adjustment_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adjustment_id uuid NOT NULL REFERENCES public.inventory_adjustments(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  qty_delta numeric(18,3) NOT NULL,
  unit_cost numeric(18,3) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.inventory_adjustments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_adjustment_items TO authenticated;
GRANT ALL ON public.inventory_adjustments, public.inventory_adjustment_items TO service_role;
ALTER TABLE public.inventory_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_adjustment_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "adj authed" ON public.inventory_adjustments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "adj items authed" ON public.inventory_adjustment_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_inv_adj_updated BEFORE UPDATE ON public.inventory_adjustments FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ---------- Audit log ----------
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,      -- insert / update / delete / post / cancel / reverse
  before jsonb,
  after jsonb,
  reason text,
  actor uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_entity_idx ON public.audit_log(entity_type, entity_id);
CREATE INDEX audit_created_idx ON public.audit_log(created_at DESC);
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit read" ON public.audit_log FOR SELECT TO authenticated USING (true);

-- Audit runs (existing feature)
CREATE TABLE public.audit_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  summary jsonb,
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid()
);
CREATE TABLE public.audit_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.audit_runs(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid,
  severity text NOT NULL DEFAULT 'info',
  code text NOT NULL,
  message text,
  details jsonb,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.audit_runs, public.audit_findings TO authenticated;
GRANT ALL ON public.audit_runs, public.audit_findings TO service_role;
ALTER TABLE public.audit_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_findings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aruns authed" ON public.audit_runs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "afind authed" ON public.audit_findings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================================
-- VIEWS: balances derived from ledgers
-- =============================================================

CREATE OR REPLACE VIEW public.v_product_stock AS
SELECT p.id AS product_id,
       p.name,
       COALESCE(SUM(m.qty_delta), 0)::numeric(18,3) AS on_hand
FROM public.products p
LEFT JOIN public.inventory_movements m ON m.product_id = p.id
GROUP BY p.id, p.name;

CREATE OR REPLACE VIEW public.v_customer_balance AS
SELECT c.id AS customer_id,
       c.name,
       (COALESCE(ob.amount, 0)
        + COALESCE(SUM(l.debit - l.credit), 0))::numeric(18,2) AS balance
FROM public.customers c
LEFT JOIN public.opening_balances ob
  ON ob.party_type = 'customer' AND ob.party_id = c.id
LEFT JOIN public.party_ledger l
  ON l.party_type = 'customer' AND l.party_id = c.id
GROUP BY c.id, c.name, ob.amount;

CREATE OR REPLACE VIEW public.v_supplier_balance AS
SELECT s.id AS supplier_id,
       s.name,
       (COALESCE(ob.amount, 0)
        + COALESCE(SUM(l.debit - l.credit), 0))::numeric(18,2) AS balance
FROM public.suppliers s
LEFT JOIN public.opening_balances ob
  ON ob.party_type = 'supplier' AND ob.party_id = s.id
LEFT JOIN public.party_ledger l
  ON l.party_type = 'supplier' AND l.party_id = s.id
GROUP BY s.id, s.name, ob.amount;

CREATE OR REPLACE VIEW public.v_treasury_balance AS
SELECT method,
       SUM(CASE WHEN direction = 'in' THEN amount ELSE -amount END)::numeric(18,2) AS balance
FROM public.treasury_movements
GROUP BY method;

GRANT SELECT ON public.v_product_stock, public.v_customer_balance, public.v_supplier_balance, public.v_treasury_balance TO authenticated;

-- =============================================================
-- Doc number generator (per prefix, per year)
-- =============================================================
CREATE TABLE public.doc_counters (
  scope text NOT NULL,
  year integer NOT NULL,
  last_number integer NOT NULL DEFAULT 0,
  PRIMARY KEY (scope, year)
);
GRANT SELECT ON public.doc_counters TO authenticated;
GRANT ALL ON public.doc_counters TO service_role;
ALTER TABLE public.doc_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "counters read" ON public.doc_counters FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.next_doc_number(_scope text, _prefix text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _year int := EXTRACT(YEAR FROM CURRENT_DATE)::int; _n int;
BEGIN
  INSERT INTO public.doc_counters(scope, year, last_number)
  VALUES (_scope, _year, 1)
  ON CONFLICT (scope, year) DO UPDATE SET last_number = doc_counters.last_number + 1
  RETURNING last_number INTO _n;
  RETURN _prefix || '-' || _year || '-' || LPAD(_n::text, 6, '0');
END $$;

-- =============================================================
-- RPCs — atomic document posting
-- =============================================================

-- ---- post_sale ----
-- payload structure:
-- {
--   "customer_id": uuid|null, "customer_name": "...",
--   "transaction_date": "YYYY-MM-DD",
--   "discount": 0, "tax": 0, "paid": 0, "payment_method": "cash",
--   "notes": "...",
--   "idempotency_key": "...",
--   "items": [{ "product_id": uuid, "product_name": "...", "qty": n, "unit_price": n, "unit_cost": n, "line_discount": n }]
-- }
CREATE OR REPLACE FUNCTION public.post_sale(payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_idem text := payload->>'idempotency_key';
  v_existing uuid;
  v_sale_id uuid;
  v_doc_number text;
  v_txdate date := COALESCE((payload->>'transaction_date')::date, CURRENT_DATE);
  v_customer_id uuid := NULLIF(payload->>'customer_id','')::uuid;
  v_customer_name text := payload->>'customer_name';
  v_discount numeric(18,2) := COALESCE((payload->>'discount')::numeric, 0);
  v_tax numeric(18,2) := COALESCE((payload->>'tax')::numeric, 0);
  v_paid numeric(18,2) := COALESCE((payload->>'paid')::numeric, 0);
  v_method text := COALESCE(payload->>'payment_method', 'cash');
  v_notes text := payload->>'notes';
  v_subtotal numeric(18,2) := 0;
  v_total_cost numeric(18,2) := 0;
  v_total numeric(18,2) := 0;
  v_remaining numeric(18,2);
  it jsonb;
  it_pid uuid; it_pname text; it_qty numeric(18,3); it_price numeric(18,3);
  it_cost numeric(18,3); it_ldisc numeric(18,2); it_ltotal numeric(18,2);
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  IF v_idem IS NOT NULL THEN
    SELECT id INTO v_existing FROM public.sales WHERE idempotency_key = v_idem;
    IF v_existing IS NOT NULL THEN RETURN v_existing; END IF;
  END IF;

  v_sale_id := gen_random_uuid();
  v_doc_number := public.next_doc_number('sale', 'S');

  -- Compute totals from items
  FOR it IN SELECT jsonb_array_elements(payload->'items') LOOP
    it_qty   := (it->>'qty')::numeric;
    it_price := COALESCE((it->>'unit_price')::numeric, 0);
    it_cost  := COALESCE((it->>'unit_cost')::numeric, 0);
    it_ldisc := COALESCE((it->>'line_discount')::numeric, 0);
    it_ltotal := ROUND(it_qty * it_price - it_ldisc, 2);
    v_subtotal := v_subtotal + it_ltotal;
    v_total_cost := v_total_cost + ROUND(it_qty * it_cost, 2);
  END LOOP;

  v_total := ROUND(v_subtotal - v_discount + v_tax, 2);
  v_remaining := v_total - v_paid;

  INSERT INTO public.sales(id, doc_number, customer_id, customer_name, status,
    subtotal, discount, tax, total, total_cost, paid, payment_method, notes,
    transaction_date, idempotency_key)
  VALUES (v_sale_id, v_doc_number, v_customer_id, v_customer_name, 'posted',
    v_subtotal, v_discount, v_tax, v_total, v_total_cost, v_paid, v_method, v_notes,
    v_txdate, v_idem);

  -- Insert items + inventory movements
  FOR it IN SELECT jsonb_array_elements(payload->'items') LOOP
    it_pid   := NULLIF(it->>'product_id','')::uuid;
    it_pname := it->>'product_name';
    it_qty   := (it->>'qty')::numeric;
    it_price := COALESCE((it->>'unit_price')::numeric, 0);
    it_cost  := COALESCE((it->>'unit_cost')::numeric, 0);
    it_ldisc := COALESCE((it->>'line_discount')::numeric, 0);
    it_ltotal := ROUND(it_qty * it_price - it_ldisc, 2);

    INSERT INTO public.sale_items(sale_id, product_id, product_name, qty, unit_price, unit_cost, line_discount, line_total)
    VALUES (v_sale_id, it_pid, it_pname, it_qty, it_price, it_cost, it_ldisc, it_ltotal);

    IF it_pid IS NOT NULL THEN
      INSERT INTO public.inventory_movements(product_id, qty_delta, unit_cost, source_type, source_id, transaction_date)
      VALUES (it_pid, -it_qty, it_cost, 'sale', v_sale_id, v_txdate);
    END IF;
  END LOOP;

  -- Customer ledger: debit customer by total (they owe us), credit by paid
  IF v_customer_id IS NOT NULL THEN
    INSERT INTO public.party_ledger(party_type, party_id, debit, credit, source_type, source_id, transaction_date)
    VALUES ('customer', v_customer_id, v_total, 0, 'sale', v_sale_id, v_txdate);
    IF v_paid > 0 THEN
      INSERT INTO public.party_ledger(party_type, party_id, debit, credit, source_type, source_id, transaction_date)
      VALUES ('customer', v_customer_id, 0, v_paid, 'sale', v_sale_id, v_txdate);
    END IF;
  END IF;

  -- Treasury: cash-in for the paid portion
  IF v_paid > 0 THEN
    INSERT INTO public.treasury_movements(direction, amount, method, source_type, source_id, transaction_date)
    VALUES ('in', v_paid, v_method, 'sale', v_sale_id, v_txdate);
  END IF;

  -- Audit
  INSERT INTO public.audit_log(entity_type, entity_id, action, after)
  VALUES ('sale', v_sale_id, 'post', jsonb_build_object('doc_number', v_doc_number, 'total', v_total, 'paid', v_paid));

  RETURN v_sale_id;
END $$;
GRANT EXECUTE ON FUNCTION public.post_sale(jsonb) TO authenticated;

-- ---- post_purchase ----
CREATE OR REPLACE FUNCTION public.post_purchase(payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_idem text := payload->>'idempotency_key';
  v_existing uuid; v_id uuid; v_doc text;
  v_txdate date := COALESCE((payload->>'transaction_date')::date, CURRENT_DATE);
  v_supp_id uuid := NULLIF(payload->>'supplier_id','')::uuid;
  v_supp_name text := payload->>'supplier_name';
  v_discount numeric(18,2) := COALESCE((payload->>'discount')::numeric, 0);
  v_tax numeric(18,2) := COALESCE((payload->>'tax')::numeric, 0);
  v_paid numeric(18,2) := COALESCE((payload->>'paid')::numeric, 0);
  v_method text := COALESCE(payload->>'payment_method', 'cash');
  v_notes text := payload->>'notes';
  v_subtotal numeric(18,2) := 0; v_total numeric(18,2) := 0;
  it jsonb; it_pid uuid; it_pname text; it_qty numeric(18,3);
  it_price numeric(18,3); it_ldisc numeric(18,2); it_ltotal numeric(18,2);
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF v_idem IS NOT NULL THEN
    SELECT id INTO v_existing FROM public.purchases WHERE idempotency_key = v_idem;
    IF v_existing IS NOT NULL THEN RETURN v_existing; END IF;
  END IF;
  v_id := gen_random_uuid();
  v_doc := public.next_doc_number('purchase', 'P');

  FOR it IN SELECT jsonb_array_elements(payload->'items') LOOP
    it_qty := (it->>'qty')::numeric;
    it_price := COALESCE((it->>'unit_price')::numeric, 0);
    it_ldisc := COALESCE((it->>'line_discount')::numeric, 0);
    v_subtotal := v_subtotal + ROUND(it_qty * it_price - it_ldisc, 2);
  END LOOP;
  v_total := ROUND(v_subtotal - v_discount + v_tax, 2);

  INSERT INTO public.purchases(id, doc_number, supplier_id, supplier_name, status,
    subtotal, discount, tax, total, paid, payment_method, notes, transaction_date, idempotency_key)
  VALUES (v_id, v_doc, v_supp_id, v_supp_name, 'posted',
    v_subtotal, v_discount, v_tax, v_total, v_paid, v_method, v_notes, v_txdate, v_idem);

  FOR it IN SELECT jsonb_array_elements(payload->'items') LOOP
    it_pid := NULLIF(it->>'product_id','')::uuid;
    it_pname := it->>'product_name';
    it_qty := (it->>'qty')::numeric;
    it_price := COALESCE((it->>'unit_price')::numeric, 0);
    it_ldisc := COALESCE((it->>'line_discount')::numeric, 0);
    it_ltotal := ROUND(it_qty * it_price - it_ldisc, 2);
    INSERT INTO public.purchase_items(purchase_id, product_id, product_name, qty, unit_price, line_discount, line_total)
    VALUES (v_id, it_pid, it_pname, it_qty, it_price, it_ldisc, it_ltotal);
    IF it_pid IS NOT NULL THEN
      INSERT INTO public.inventory_movements(product_id, qty_delta, unit_cost, source_type, source_id, transaction_date)
      VALUES (it_pid, it_qty, it_price, 'purchase', v_id, v_txdate);
    END IF;
  END LOOP;

  IF v_supp_id IS NOT NULL THEN
    -- Supplier: credit by total (we owe them), debit by paid
    INSERT INTO public.party_ledger(party_type, party_id, debit, credit, source_type, source_id, transaction_date)
    VALUES ('supplier', v_supp_id, 0, v_total, 'purchase', v_id, v_txdate);
    IF v_paid > 0 THEN
      INSERT INTO public.party_ledger(party_type, party_id, debit, credit, source_type, source_id, transaction_date)
      VALUES ('supplier', v_supp_id, v_paid, 0, 'purchase', v_id, v_txdate);
    END IF;
  END IF;
  IF v_paid > 0 THEN
    INSERT INTO public.treasury_movements(direction, amount, method, source_type, source_id, transaction_date)
    VALUES ('out', v_paid, v_method, 'purchase', v_id, v_txdate);
  END IF;
  INSERT INTO public.audit_log(entity_type, entity_id, action, after)
  VALUES ('purchase', v_id, 'post', jsonb_build_object('doc_number', v_doc, 'total', v_total, 'paid', v_paid));
  RETURN v_id;
END $$;
GRANT EXECUTE ON FUNCTION public.post_purchase(jsonb) TO authenticated;

-- ---- post_payment ----
CREATE OR REPLACE FUNCTION public.post_payment(payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_idem text := payload->>'idempotency_key';
  v_existing uuid; v_id uuid; v_doc text;
  v_ptype public.party_type := (payload->>'party_type')::public.party_type;
  v_pid uuid := (payload->>'party_id')::uuid;
  v_pname text := payload->>'party_name';
  v_dir public.payment_direction := (payload->>'direction')::public.payment_direction;
  v_amount numeric(18,2) := (payload->>'amount')::numeric;
  v_method text := COALESCE(payload->>'method','cash');
  v_txdate date := COALESCE((payload->>'transaction_date')::date, CURRENT_DATE);
  v_notes text := payload->>'notes';
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF v_idem IS NOT NULL THEN
    SELECT id INTO v_existing FROM public.payments WHERE idempotency_key = v_idem;
    IF v_existing IS NOT NULL THEN RETURN v_existing; END IF;
  END IF;
  v_id := gen_random_uuid();
  v_doc := public.next_doc_number('payment', 'R');

  INSERT INTO public.payments(id, doc_number, party_type, party_id, party_name, direction, amount, method, transaction_date, notes, idempotency_key)
  VALUES (v_id, v_doc, v_ptype, v_pid, v_pname, v_dir, v_amount, v_method, v_txdate, v_notes, v_idem);

  -- Party ledger: incoming from customer = credit customer (reduce debit balance).
  -- Outgoing to supplier = debit supplier (reduce credit balance).
  IF v_dir = 'in' THEN
    INSERT INTO public.party_ledger(party_type, party_id, debit, credit, source_type, source_id, transaction_date)
    VALUES (v_ptype, v_pid, 0, v_amount, 'payment', v_id, v_txdate);
    INSERT INTO public.treasury_movements(direction, amount, method, source_type, source_id, transaction_date)
    VALUES ('in', v_amount, v_method, 'payment', v_id, v_txdate);
  ELSE
    INSERT INTO public.party_ledger(party_type, party_id, debit, credit, source_type, source_id, transaction_date)
    VALUES (v_ptype, v_pid, v_amount, 0, 'payment', v_id, v_txdate);
    INSERT INTO public.treasury_movements(direction, amount, method, source_type, source_id, transaction_date)
    VALUES ('out', v_amount, v_method, 'payment', v_id, v_txdate);
  END IF;

  INSERT INTO public.audit_log(entity_type, entity_id, action, after)
  VALUES ('payment', v_id, 'post', jsonb_build_object('doc_number', v_doc, 'amount', v_amount, 'direction', v_dir));
  RETURN v_id;
END $$;
GRANT EXECUTE ON FUNCTION public.post_payment(jsonb) TO authenticated;

-- ---- post_expense ----
CREATE OR REPLACE FUNCTION public.post_expense(payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_idem text := payload->>'idempotency_key';
  v_existing uuid; v_id uuid; v_doc text;
  v_amount numeric(18,2) := (payload->>'amount')::numeric;
  v_cat text := COALESCE(payload->>'category','general');
  v_method text := COALESCE(payload->>'method','cash');
  v_txdate date := COALESCE((payload->>'transaction_date')::date, CURRENT_DATE);
  v_notes text := payload->>'notes';
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF v_idem IS NOT NULL THEN
    SELECT id INTO v_existing FROM public.expenses WHERE idempotency_key = v_idem;
    IF v_existing IS NOT NULL THEN RETURN v_existing; END IF;
  END IF;
  v_id := gen_random_uuid();
  v_doc := public.next_doc_number('expense', 'E');
  INSERT INTO public.expenses(id, doc_number, category, amount, method, transaction_date, notes, idempotency_key)
  VALUES (v_id, v_doc, v_cat, v_amount, v_method, v_txdate, v_notes, v_idem);
  INSERT INTO public.treasury_movements(direction, amount, method, source_type, source_id, transaction_date)
  VALUES ('out', v_amount, v_method, 'expense', v_id, v_txdate);
  INSERT INTO public.audit_log(entity_type, entity_id, action, after)
  VALUES ('expense', v_id, 'post', jsonb_build_object('doc_number', v_doc, 'amount', v_amount, 'category', v_cat));
  RETURN v_id;
END $$;
GRANT EXECUTE ON FUNCTION public.post_expense(jsonb) TO authenticated;

-- ---- cancel_document (generic reversal) ----
-- Reverses the ledger entries by inserting mirror rows AND flips status to 'cancelled'.
-- Supported: sale, purchase, payment, expense, sale_return, purchase_return, inventory_adjustment
CREATE OR REPLACE FUNCTION public.cancel_document(entity_type text, entity_id uuid, reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_source public.ledger_source_type;
  v_cur_status public.doc_status;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  v_source := entity_type::public.ledger_source_type;

  -- Fetch current status
  IF entity_type = 'sale' THEN
    SELECT status INTO v_cur_status FROM public.sales WHERE id = entity_id FOR UPDATE;
  ELSIF entity_type = 'purchase' THEN
    SELECT status INTO v_cur_status FROM public.purchases WHERE id = entity_id FOR UPDATE;
  ELSIF entity_type = 'payment' THEN
    SELECT status INTO v_cur_status FROM public.payments WHERE id = entity_id FOR UPDATE;
  ELSIF entity_type = 'expense' THEN
    SELECT status INTO v_cur_status FROM public.expenses WHERE id = entity_id FOR UPDATE;
  ELSIF entity_type = 'sale_return' THEN
    SELECT status INTO v_cur_status FROM public.sale_returns WHERE id = entity_id FOR UPDATE;
  ELSIF entity_type = 'purchase_return' THEN
    SELECT status INTO v_cur_status FROM public.purchase_returns WHERE id = entity_id FOR UPDATE;
  ELSIF entity_type = 'inventory_adjustment' THEN
    SELECT status INTO v_cur_status FROM public.inventory_adjustments WHERE id = entity_id FOR UPDATE;
  ELSE
    RAISE EXCEPTION 'unsupported entity_type: %', entity_type;
  END IF;

  IF v_cur_status IS NULL THEN RAISE EXCEPTION 'document not found'; END IF;
  IF v_cur_status = 'cancelled' THEN RAISE EXCEPTION 'document already cancelled'; END IF;

  -- Reverse inventory movements
  INSERT INTO public.inventory_movements(product_id, qty_delta, unit_cost, source_type, source_id, transaction_date, notes)
  SELECT product_id, -qty_delta, unit_cost, v_source, entity_id, CURRENT_DATE, 'cancel reversal'
  FROM public.inventory_movements
  WHERE source_type = v_source AND source_id = entity_id
    AND notes IS DISTINCT FROM 'cancel reversal';

  -- Reverse party ledger
  INSERT INTO public.party_ledger(party_type, party_id, debit, credit, source_type, source_id, transaction_date, notes)
  SELECT party_type, party_id, credit, debit, v_source, entity_id, CURRENT_DATE, 'cancel reversal'
  FROM public.party_ledger
  WHERE source_type = v_source AND source_id = entity_id
    AND notes IS DISTINCT FROM 'cancel reversal';

  -- Reverse treasury
  INSERT INTO public.treasury_movements(direction, amount, method, source_type, source_id, transaction_date, notes)
  SELECT CASE WHEN direction='in' THEN 'out'::public.payment_direction ELSE 'in'::public.payment_direction END,
         amount, method, v_source, entity_id, CURRENT_DATE, 'cancel reversal'
  FROM public.treasury_movements
  WHERE source_type = v_source AND source_id = entity_id
    AND notes IS DISTINCT FROM 'cancel reversal';

  -- Flip status
  IF entity_type = 'sale' THEN
    UPDATE public.sales SET status='cancelled', cancelled_at=now(), cancellation_reason=reason, cancelled_by=auth.uid() WHERE id=entity_id;
  ELSIF entity_type = 'purchase' THEN
    UPDATE public.purchases SET status='cancelled', cancelled_at=now(), cancellation_reason=reason, cancelled_by=auth.uid() WHERE id=entity_id;
  ELSIF entity_type = 'payment' THEN
    UPDATE public.payments SET status='cancelled', cancelled_at=now(), cancellation_reason=reason, cancelled_by=auth.uid() WHERE id=entity_id;
  ELSIF entity_type = 'expense' THEN
    UPDATE public.expenses SET status='cancelled', cancelled_at=now(), cancellation_reason=reason, cancelled_by=auth.uid() WHERE id=entity_id;
  ELSIF entity_type = 'sale_return' THEN
    UPDATE public.sale_returns SET status='cancelled', cancelled_at=now(), cancellation_reason=reason, cancelled_by=auth.uid() WHERE id=entity_id;
  ELSIF entity_type = 'purchase_return' THEN
    UPDATE public.purchase_returns SET status='cancelled', cancelled_at=now(), cancellation_reason=reason, cancelled_by=auth.uid() WHERE id=entity_id;
  ELSIF entity_type = 'inventory_adjustment' THEN
    UPDATE public.inventory_adjustments SET status='cancelled', cancelled_at=now(), cancellation_reason=reason, cancelled_by=auth.uid() WHERE id=entity_id;
  END IF;

  INSERT INTO public.audit_log(entity_type, entity_id, action, reason)
  VALUES (entity_type, entity_id, 'cancel', reason);
END $$;
GRANT EXECUTE ON FUNCTION public.cancel_document(text, uuid, text) TO authenticated;

-- ---- apply_opening_balance (party) ----
CREATE OR REPLACE FUNCTION public.apply_opening_balance(_party_type public.party_type, _party_id uuid, _amount numeric, _as_of date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  INSERT INTO public.opening_balances(party_type, party_id, amount, as_of_date)
  VALUES (_party_type, _party_id, _amount, _as_of)
  ON CONFLICT (party_type, party_id) DO UPDATE
    SET amount = EXCLUDED.amount, as_of_date = EXCLUDED.as_of_date;
END $$;
GRANT EXECUTE ON FUNCTION public.apply_opening_balance(public.party_type, uuid, numeric, date) TO authenticated;
