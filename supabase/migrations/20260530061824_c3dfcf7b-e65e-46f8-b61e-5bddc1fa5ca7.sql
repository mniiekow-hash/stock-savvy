-- Create stock_batches table to track each purchase as a separate batch
CREATE TABLE public.stock_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.stock_items(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL DEFAULT 0,
  pack_unit TEXT NOT NULL DEFAULT 'unit',
  total_price NUMERIC NOT NULL DEFAULT 0,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  is_opening_stock BOOLEAN NOT NULL DEFAULT false,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_batches TO anon, authenticated;
GRANT ALL ON public.stock_batches TO service_role;

ALTER TABLE public.stock_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read stock_batches" ON public.stock_batches FOR SELECT USING (true);
CREATE POLICY "Public insert stock_batches" ON public.stock_batches FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update stock_batches" ON public.stock_batches FOR UPDATE USING (true);
CREATE POLICY "Public delete stock_batches" ON public.stock_batches FOR DELETE USING (true);

CREATE INDEX idx_stock_batches_item ON public.stock_batches(item_id, created_at DESC);

-- Auto-calc unit_price from total/quantity, and roll up to stock_items
CREATE OR REPLACE FUNCTION public.apply_stock_batch()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.quantity > 0 THEN
    NEW.unit_price := NEW.total_price / NEW.quantity;
  ELSE
    NEW.unit_price := 0;
  END IF;

  UPDATE public.stock_items
    SET current_quantity = COALESCE((SELECT SUM(quantity) FROM public.stock_batches WHERE item_id = NEW.item_id), 0) + NEW.quantity
        - COALESCE((SELECT SUM(CASE WHEN type='sale' THEN quantity WHEN type='adjustment' THEN -quantity ELSE 0 END) FROM public.stock_transactions WHERE item_id = NEW.item_id), 0),
        unit_price = NEW.unit_price,
        updated_at = now()
    WHERE id = NEW.item_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_apply_stock_batch
BEFORE INSERT ON public.stock_batches
FOR EACH ROW EXECUTE FUNCTION public.apply_stock_batch();

-- Backfill: create an opening-stock batch for any existing items that have current_quantity > 0
INSERT INTO public.stock_batches (item_id, quantity, pack_unit, total_price, unit_price, is_opening_stock, note, created_at)
SELECT id, current_quantity, unit, current_quantity * unit_price, unit_price, true, 'Migrated opening stock', created_at
FROM public.stock_items
WHERE current_quantity > 0;