
-- post_sale_return
CREATE OR REPLACE FUNCTION public.post_sale_return(payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_idem text := payload->>'idempotency_key';
  v_existing uuid; v_id uuid; v_doc text;
  v_sale_id uuid := (payload->>'sale_id')::uuid;
  v_cust_id uuid := (payload->>'customer_id')::uuid;
  v_txdate date := COALESCE((payload->>'transaction_date')::date, CURRENT_DATE);
  v_notes text := payload->>'notes';
  v_refund numeric(18,2) := COALESCE((payload->>'refund_amount')::numeric, 0);
  v_method text := payload->>'payment_method';
  v_total numeric(18,2) := 0;
  it jsonb; it_pid uuid; it_pname text; it_qty numeric(18,3); it_price numeric(18,3); it_ltotal numeric(18,2);
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF v_idem IS NOT NULL THEN
    SELECT id INTO v_existing FROM public.sale_returns WHERE idempotency_key = v_idem;
    IF v_existing IS NOT NULL THEN RETURN v_existing; END IF;
  END IF;

  v_id := gen_random_uuid();
  v_doc := public.next_doc_number('sale_return', 'SR');

  -- Calculate total from items
  FOR it IN SELECT jsonb_array_elements(payload->'items') LOOP
    v_total := v_total + (COALESCE((it->>'qty')::numeric,0) * COALESCE((it->>'unit_price')::numeric,0));
  END LOOP;

  INSERT INTO public.sale_returns(id, doc_number, sale_id, customer_id, status, total, refund_amount, payment_method, notes, transaction_date, idempotency_key)
  VALUES (v_id, v_doc, v_sale_id, v_cust_id, 'posted', v_total, v_refund, v_method, v_notes, v_txdate, v_idem);

  FOR it IN SELECT jsonb_array_elements(payload->'items') LOOP
    it_pid := (it->>'product_id')::uuid;
    it_pname := it->>'product_name';
    it_qty := (it->>'qty')::numeric;
    it_price := COALESCE((it->>'unit_price')::numeric, 0);
    it_ltotal := it_qty * it_price;

    INSERT INTO public.sale_return_items(return_id, product_id, product_name, qty, unit_price, line_total)
    VALUES (v_id, it_pid, it_pname, it_qty, it_price, it_ltotal);

    -- Increase stock
    IF it_pid IS NOT NULL THEN
      INSERT INTO public.inventory_movements(product_id, qty_delta, unit_cost, source_type, source_id, transaction_date)
      VALUES (it_pid, it_qty, it_price, 'sale_return', v_id, v_txdate);
    END IF;
  END LOOP;

  -- Customer: credit by total return (reduce their debt)
  INSERT INTO public.party_ledger(party_type, party_id, debit, credit, source_type, source_id, transaction_date)
  VALUES ('customer', v_cust_id, 0, v_total, 'sale_return', v_id, v_txdate);

  -- If cash refund was given: debit customer (increase debt) and out treasury
  IF v_refund > 0 THEN
    INSERT INTO public.party_ledger(party_type, party_id, debit, credit, source_type, source_id, transaction_date)
    VALUES ('customer', v_cust_id, v_refund, 0, 'sale_return', v_id, v_txdate);
    INSERT INTO public.treasury_movements(direction, amount, method, source_type, source_id, transaction_date)
    VALUES ('out', v_refund, v_method, 'sale_return', v_id, v_txdate);
  END IF;

  RETURN v_id;
END $$;
GRANT EXECUTE ON FUNCTION public.post_sale_return(jsonb) TO authenticated;

-- post_purchase_return
CREATE OR REPLACE FUNCTION public.post_purchase_return(payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_idem text := payload->>'idempotency_key';
  v_existing uuid; v_id uuid; v_doc text;
  v_pur_id uuid := (payload->>'purchase_id')::uuid;
  v_supp_id uuid := (payload->>'supplier_id')::uuid;
  v_txdate date := COALESCE((payload->>'transaction_date')::date, CURRENT_DATE);
  v_notes text := payload->>'notes';
  v_refund numeric(18,2) := COALESCE((payload->>'refund_amount')::numeric, 0);
  v_method text := payload->>'payment_method';
  v_total numeric(18,2) := 0;
  it jsonb; it_pid uuid; it_pname text; it_qty numeric(18,3); it_price numeric(18,3); it_ltotal numeric(18,2);
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF v_idem IS NOT NULL THEN
    SELECT id INTO v_existing FROM public.purchase_returns WHERE idempotency_key = v_idem;
    IF v_existing IS NOT NULL THEN RETURN v_existing; END IF;
  END IF;

  v_id := gen_random_uuid();
  v_doc := public.next_doc_number('purchase_return', 'PR');

  FOR it IN SELECT jsonb_array_elements(payload->'items') LOOP
    v_total := v_total + (COALESCE((it->>'qty')::numeric,0) * COALESCE((it->>'unit_price')::numeric,0));
  END LOOP;

  INSERT INTO public.purchase_returns(id, doc_number, purchase_id, supplier_id, status, total, refund_amount, payment_method, notes, transaction_date, idempotency_key)
  VALUES (v_id, v_doc, v_pur_id, v_supp_id, 'posted', v_total, v_refund, v_method, v_notes, v_txdate, v_idem);

  FOR it IN SELECT jsonb_array_elements(payload->'items') LOOP
    it_pid := (it->>'product_id')::uuid;
    it_pname := it->>'product_name';
    it_qty := (it->>'qty')::numeric;
    it_price := COALESCE((it->>'unit_price')::numeric, 0);
    it_ltotal := it_qty * it_price;

    INSERT INTO public.purchase_return_items(return_id, product_id, product_name, qty, unit_price, line_total)
    VALUES (v_id, it_pid, it_pname, it_qty, it_price, it_ltotal);

    -- Decrease stock
    IF it_pid IS NOT NULL THEN
      INSERT INTO public.inventory_movements(product_id, qty_delta, unit_cost, source_type, source_id, transaction_date)
      VALUES (it_pid, -it_qty, it_price, 'purchase_return', v_id, v_txdate);
    END IF;
  END LOOP;

  -- Supplier: debit by total return (reduce what we owe them)
  INSERT INTO public.party_ledger(party_type, party_id, debit, credit, source_type, source_id, transaction_date)
  VALUES ('supplier', v_supp_id, v_total, 0, 'purchase_return', v_id, v_txdate);

  -- If cash refund was received: credit supplier (increase what we owe / offset) and in treasury
  IF v_refund > 0 THEN
    INSERT INTO public.party_ledger(party_type, party_id, debit, credit, source_type, source_id, transaction_date)
    VALUES ('supplier', v_supp_id, 0, v_refund, 'purchase_return', v_id, v_txdate);
    INSERT INTO public.treasury_movements(direction, amount, method, source_type, source_id, transaction_date)
    VALUES ('in', v_refund, v_method, 'purchase_return', v_id, v_txdate);
  END IF;

  RETURN v_id;
END $$;
GRANT EXECUTE ON FUNCTION public.post_purchase_return(jsonb) TO authenticated;
