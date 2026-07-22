
ALTER VIEW public.v_product_stock     SET (security_invoker = true);
ALTER VIEW public.v_customer_balance  SET (security_invoker = true);
ALTER VIEW public.v_supplier_balance  SET (security_invoker = true);
ALTER VIEW public.v_treasury_balance  SET (security_invoker = true);
