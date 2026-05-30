import { supabase } from "@/integrations/supabase/client";

export type StockItem = {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  unit_price: number;
  current_quantity: number;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
};

export type TransactionType = "purchase" | "sale" | "adjustment";

export type StockTransaction = {
  id: string;
  item_id: string;
  type: TransactionType;
  quantity: number;
  unit_price: number;
  total_amount: number;
  note: string | null;
  created_at: string;
};

export type StockBatch = {
  id: string;
  item_id: string;
  quantity: number;
  pack_unit: string;
  total_price: number;
  unit_price: number;
  is_opening_stock: boolean;
  note: string | null;
  created_at: string;
};

export const PACK_UNITS = [
  "crates",
  "packs",
  "boxes",
  "cartons",
  "bags",
  "sacks",
  "bundles",
  "dozens",
  "trays",
  "rolls",
  "pieces",
  "units",
];

export async function fetchItems(): Promise<StockItem[]> {
  const { data, error } = await supabase
    .from("stock_items")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as StockItem[];
}

export async function fetchItem(id: string): Promise<StockItem> {
  const { data, error } = await supabase
    .from("stock_items")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as StockItem;
}

export async function fetchBatches(itemId: string): Promise<StockBatch[]> {
  const { data, error } = await supabase
    .from("stock_batches" as any)
    .select("*")
    .eq("item_id", itemId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as StockBatch[];
}

export async function fetchTransactions(limit = 25): Promise<
  (StockTransaction & { stock_items: { name: string; unit: string } | null })[]
> {
  const { data, error } = await supabase
    .from("stock_transactions")
    .select("*, stock_items(name, unit)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as any;
}

export async function createItemWithOpening(input: {
  name: string;
  low_stock_threshold: number;
  opening_quantity: number;
  pack_unit: string;
  opening_total_price: number;
}) {
  const unit_price =
    input.opening_quantity > 0 ? input.opening_total_price / input.opening_quantity : 0;

  const { data: item, error: itemErr } = await supabase
    .from("stock_items")
    .insert({
      name: input.name.trim(),
      unit: input.pack_unit,
      unit_price,
      current_quantity: 0, // trigger on batch will set it
      low_stock_threshold: input.low_stock_threshold,
    })
    .select()
    .single();
  if (itemErr) throw itemErr;

  if (input.opening_quantity > 0) {
    const { error: batchErr } = await supabase.from("stock_batches" as any).insert({
      item_id: item.id,
      quantity: input.opening_quantity,
      pack_unit: input.pack_unit,
      total_price: input.opening_total_price,
      is_opening_stock: true,
      note: "Opening stock",
    });
    if (batchErr) throw batchErr;
  }
  return item as StockItem;
}

export async function createPurchaseBatch(input: {
  item_id: string;
  quantity: number;
  pack_unit: string;
  total_price: number;
  note?: string;
}) {
  const { error } = await supabase.from("stock_batches" as any).insert({
    item_id: input.item_id,
    quantity: input.quantity,
    pack_unit: input.pack_unit,
    total_price: input.total_price,
    is_opening_stock: false,
    note: input.note?.trim() || null,
  });
  if (error) throw error;
}

export async function deleteItem(id: string) {
  const { error } = await supabase.from("stock_items").delete().eq("id", id);
  if (error) throw error;
}

export async function recordTransaction(input: {
  item_id: string;
  type: TransactionType;
  quantity: number;
  unit_price: number;
  note?: string;
}) {
  const { error } = await supabase.from("stock_transactions").insert({
    item_id: input.item_id,
    type: input.type,
    quantity: input.quantity,
    unit_price: input.unit_price,
    total_amount: input.quantity * input.unit_price,
    note: input.note?.trim() || null,
  });
  if (error) throw error;
}

export function formatCurrency(n: number) {
  const formatted = new Intl.NumberFormat("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0);
  return `₵${formatted}`;
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);
}
