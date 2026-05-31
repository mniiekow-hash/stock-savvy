## Goal
Right now the dashboard is built for a laptop screen, so on Android/iPhone the content overflows horizontally and users have to scroll sideways to see actions, table columns, and the "Recent activity" panel. I'll make every screen adapt cleanly to small phones (≈360px and up) without changing any business logic.

## What I'll change (UI only)

### 1. Dashboard header (`src/routes/index.tsx`)
- Reduce horizontal padding on mobile (`px-4` → `sm:px-6` → `lg:px-10`) so it stops overflowing.
- Allow the header to wrap: logo + title on one row, action buttons (`Record transaction`, `Add item`) drop to a second row on phones and become full-width.
- Shrink the title font on mobile and hide the subtitle on very small screens to keep one tidy row.

### 2. Hero / KPI section
- Bring "Inventory overview" heading from `text-3xl/4xl` down to `text-2xl` on mobile.
- KPI grid: already `sm:grid-cols-2 lg:grid-cols-4`, but stat cards themselves are too tall — reduce padding (`p-4 sm:p-5`) and the value font (`text-2xl sm:text-3xl`) in `StatCard.tsx` so 2 fit per row on a 360px screen.

### 3. Inventory table (`src/components/inventory/InventoryTable.tsx`) — the main culprit
The table has 6 columns and forces a horizontal scrollbar on phones. I'll:
- Keep the full table for `md` and up (unchanged).
- On mobile (`<md`), render the same items as **stacked cards** instead of a table:
  - Top row: item name (link) + status badge.
  - Middle: remaining qty, latest unit price, stock value as a 2-col mini-grid.
  - Bottom: `Buy in`, `Sell`, `Delete` action buttons in a single row, full width.
- Move the search input above the list and make it full-width on mobile.

### 4. Recent activity panel (`TransactionsList.tsx`)
- Already stacks below the table on mobile thanks to `lg:grid-cols-3`, just tighten padding (`px-4 sm:px-5`) and let the right-side amount wrap under the date on very narrow screens so nothing clips.

### 5. Item detail page (`src/routes/items.$itemId.tsx`)
- Same padding fix (`px-4 sm:px-6 lg:px-10`).
- Shrink the item title to `text-2xl sm:text-3xl`.
- Stat grid uses the same 2-up mobile layout as the dashboard.
- Batch grid: already `md:grid-cols-2`, fine — just make sure `BatchCard` content doesn't overflow (wrap long notes, shrink price font on mobile).

### 6. Global safeguard
- Add `overflow-x-hidden` on the page root containers so any stray wide element can't cause the whole viewport to scroll sideways again.
- Verify dialogs (`AddItemDialog`, `RecordTransactionDialog`) use `max-w-[calc(100vw-2rem)]` so they don't get cut off on small screens.

## Out of scope
- No changes to data model, queries, batch logic, or pricing rules.
- No new pages or features — purely layout/CSS adjustments to existing components.

## How I'll verify
After changes, I'll preview at mobile width (375px) to confirm: no horizontal scroll, all header actions reachable without sliding, inventory rows readable as cards, KPIs in 2 columns, dialogs fit within the screen.
