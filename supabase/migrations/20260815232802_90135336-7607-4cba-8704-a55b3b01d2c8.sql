-- فحص الفواتير التي لا تحتوي على بنود
CREATE OR REPLACE FUNCTION public.check_audit_sales_no_items()
RETURNS TABLE (entity_id uuid, entity_type text, message text, details jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as entity_id,
    'sale'::text as entity_type,
    'فاتورة بدون أصناف'::text as message,
    jsonb_build_object('doc_number', s.doc_number) as details
  FROM public.sales s
  LEFT JOIN public.sale_items si ON s.id = si.sale_id
  WHERE si.id IS NULL AND s.status = 'posted';
END;
$$;

-- فحص الفوارق بين المخزون والحركات (تبسيط للمثال)
CREATE OR REPLACE FUNCTION public.check_audit_inventory_mismatches()
RETURNS TABLE (entity_id uuid, entity_type text, message text, details jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- هنا يمكن إضافة استعلامات معقدة للمطابقة
  -- حالياً نرجع جدول فارغ
  RETURN;
END;
$$;

-- فحص الفوارق في الـ Ledger
CREATE OR REPLACE FUNCTION public.check_audit_ledger_mismatches()
RETURNS TABLE (entity_id uuid, entity_type text, message text, details jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_audit_sales_no_items() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_audit_inventory_mismatches() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_audit_ledger_mismatches() TO authenticated;
