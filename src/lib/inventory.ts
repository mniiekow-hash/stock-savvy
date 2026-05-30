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

export async function fetchItems(): Promise<StockItem[]> {
  const { data, error } = await supabase
    .from("stock_items")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as StockItem[];
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

export async function createItem(input: {
  name: string;
  sku?: string;
  unit: string;
  unit_price: number;
  current_quantity: number;
  low_stock_threshold: number;
}) {
  const { error } = await supabase.from("stock_items").insert({
    name: input.name.trim(),
    sku: input.sku?.trim() || null,
    unit: input.unit.trim() || "unit",
    unit_price: input.unit_price,
    current_quantity: input.current_quantity,
    low_stock_threshold: input.low_stock_threshold,
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
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);
}
