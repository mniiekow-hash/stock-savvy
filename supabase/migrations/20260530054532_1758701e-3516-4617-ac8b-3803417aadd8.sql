
CREATE OR REPLACE FUNCTION public.apply_stock_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
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
