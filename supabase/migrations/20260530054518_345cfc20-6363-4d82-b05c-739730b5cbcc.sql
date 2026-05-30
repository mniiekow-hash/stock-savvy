
CREATE TABLE public.stock_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT,
  unit TEXT NOT NULL DEFAULT 'unit',
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  current_quantity NUMERIC(12,2) NOT NULL DEFAULT 0,
  low_stock_threshold NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_items TO anon, authenticated;
GRANT ALL ON public.stock_items TO service_role;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read stock_items" ON public.stock_items FOR SELECT USING (true);
CREATE POLICY "Public insert stock_items" ON public.stock_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update stock_items" ON public.stock_items FOR UPDATE USING (true);
CREATE POLICY "Public delete stock_items" ON public.stock_items FOR DELETE USING (true);

CREATE TABLE public.stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.stock_items(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase','sale','adjustment')),
  quantity NUMERIC(12,2) NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_transactions TO anon, authenticated;
GRANT ALL ON public.stock_transactions TO service_role;
ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read stock_transactions" ON public.stock_transactions FOR SELECT USING (true);
CREATE POLICY "Public insert stock_transactions" ON public.stock_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update stock_transactions" ON public.stock_transactions FOR UPDATE USING (true);
CREATE POLICY "Public delete stock_transactions" ON public.stock_transactions FOR DELETE USING (true);

CREATE INDEX idx_stock_transactions_item_id ON public.stock_transactions(item_id);
CREATE INDEX idx_stock_transactions_created_at ON public.stock_transactions(created_at DESC);

-- Trigger to update item quantity & price and item updated_at after a transaction
CREATE OR REPLACE FUNCTION public.apply_stock_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.total_amount := NEW.quantity * NEW.unit_price;

  IF NEW.type = 'purchase' THEN
    UPDATE public.stock_items
      SET current_quantity = current_quantity + NEW.quantity,
          unit_price = NEW.unit_price,
          updated_at = now()
      WHERE id = NEW.item_id;
  ELSIF NEW.type = 'sale' THEN
    UPDATE public.stock_items
      SET current_quantity = current_quantity - NEW.quantity,
          updated_at = now()
      WHERE id = NEW.item_id;
  ELSIF NEW.type = 'adjustment' THEN
    UPDATE public.stock_items
      SET current_quantity = current_quantity + NEW.quantity,
          updated_at = now()
      WHERE id = NEW.item_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_apply_stock_transaction
  BEFORE INSERT ON public.stock_transactions
  FOR EACH ROW EXECUTE FUNCTION public.apply_stock_transaction();
