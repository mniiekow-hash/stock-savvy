## What changes

Restructure inventory so each purchase is a separate **batch** (preserved forever with its own price), not an overwrite. Each item gets a detail page that stacks every batch — old in-stock first, then each new purchase — as separate "sheets" with the same headings.

## Data model

Add a new `stock_batches` table:
- `item_id`, `quantity` (number), `pack_unit` (crates/packs/boxes/etc.), `total_price`, `unit_price` (auto-calculated = total / quantity), `is_opening_stock` (true for the starting/old stock entry), `note`, `created_at`.

Keep `stock_items` for item-level info (name, low-stock threshold). Drop the per-item `unit_price` / `current_quantity` from the form — these now derive from batches:
- **Remaining quantity** = sum of all batch quantities − sales
- **Latest price** = most recent batch's unit price
- **Average price** = total spent ÷ total quantity (shown on detail page)

`stock_transactions` stays for sales/adjustments only.

## Add Stock Item form (simplified)

Fields: **Item name**, **Low-stock alert threshold**. Then a "starting stock" section:
- Quantity (number) + Pack unit (dropdown: crates, packs, boxes, cartons, bags, sacks, bundles, dozens, pieces — plus custom)
- Total price (₵) — app shows unit price live

Saving creates the item + one opening batch flagged `is_opening_stock = true`.

## Record Purchase dialog

Pick item → enter quantity + pack unit + total price → save. Creates a new batch row. (Sales/adjustments stay as transactions.)

## Per-item detail page (`/items/$itemId`)

The "two sheets" view. Header shows item name, total remaining, average unit price, latest unit price.

Below that, a vertical stack of cards — one per batch — each with identical headings:

```
┌─ Opening stock · 12 May 2026 ──────┐    ┌─ Purchase · 28 May 2026 ──────┐
│ Quantity:     4 crates             │    │ Quantity:     6 crates         │
│ Total price:  ₵160.00              │    │ Total price:  ₵250.00          │
│ Unit price:   ₵40.00 / crate       │    │ Unit price:   ₵41.67 / crate   │
└────────────────────────────────────┘    └────────────────────────────────┘
```

Newest batch on top. Clicking an item row in the dashboard table opens this page.

## Files

- Migration: create `stock_batches`, backfill from existing `stock_items` opening data, update `apply_stock_transaction` trigger to read remaining qty from batches.
- New route: `src/routes/items.$itemId.tsx`
- New component: `src/components/inventory/BatchCard.tsx`
- Update: `AddItemDialog.tsx` (new fields), `RecordTransactionDialog.tsx` (purchase writes a batch), `InventoryTable.tsx` (link rows to detail page, show derived qty/price), `src/lib/inventory.ts` (batch CRUD + helpers), pack-unit constant list.

Confirm and I'll switch to build mode.