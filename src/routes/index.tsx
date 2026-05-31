import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Boxes, Wallet, PackageCheck } from "lucide-react";
import {
  fetchItems,
  fetchTransactions,
  formatCurrency,
} from "@/lib/inventory";
import { AddItemDialog } from "@/components/inventory/AddItemDialog";
import { RecordTransactionDialog } from "@/components/inventory/RecordTransactionDialog";
import { StatCard } from "@/components/inventory/StatCard";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { TransactionsList } from "@/components/inventory/TransactionsList";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StockLedger — Inventory & Stock Tracker" },
      {
        name: "description",
        content:
          "Record stock purchases with prices, track sales, and monitor remaining inventory value in real time for your organization.",
      },
      { property: "og:title", content: "StockLedger — Inventory & Stock Tracker" },
      {
        property: "og:description",
        content:
          "Record stock purchases with prices, track sales, and monitor remaining inventory value in real time.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const itemsQ = useQuery({ queryKey: ["items"], queryFn: fetchItems });
  const txQ = useQuery({ queryKey: ["transactions"], queryFn: () => fetchTransactions(25) });

  const items = itemsQ.data ?? [];
  const totalValue = items.reduce((s, i) => s + i.current_quantity * i.unit_price, 0);
  const totalQuantity = items.reduce((s, i) => s + i.current_quantity, 0);
  const lowStock = items.filter((i) => i.current_quantity <= i.low_stock_threshold).length;

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-primary-foreground shadow-[var(--shadow-soft)]"
              style={{ background: "var(--gradient-hero)" }}
            >
              <Boxes className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold tracking-tight">StockLedger</h1>
              <p className="hidden truncate text-xs text-muted-foreground sm:block">
                Organizational inventory & stock tracker
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
            <RecordTransactionDialog items={items} />
            <AddItemDialog />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        {/* Hero / title */}
        <section className="mb-6 sm:mb-8">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">Inventory overview</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Real-time picture of what you own, what it cost, and what's left on the shelf.
          </p>
        </section>

        {/* KPIs */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            label="Total stock value (GH₵)"
            value={formatCurrency(totalValue)}
            hint="Quantity × unit price"
            icon={Wallet}
            tone="primary"
          />
          <StatCard
            label="Items tracked"
            value={String(items.length)}
            hint="Distinct SKUs"
            icon={PackageCheck}
            tone="accent"
          />
          <StatCard
            label="Total units on hand"
            value={new Intl.NumberFormat().format(Math.round(totalQuantity * 100) / 100)}
            hint="Across all items"
            icon={Boxes}
            tone="success"
          />
          <StatCard
            label="Low / out of stock"
            value={String(lowStock)}
            hint="At or below threshold"
            icon={AlertTriangle}
            tone="warning"
          />
        </section>

        {/* Main grid */}
        <section className="mt-6 grid gap-6 sm:mt-8 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            {itemsQ.isLoading ? (
              <div className="h-64 animate-pulse rounded-xl border border-border/60 bg-surface-muted/50" />
            ) : (
              <InventoryTable items={items} />
            )}
          </div>
          <div className="min-w-0">
            {txQ.isLoading ? (
              <div className="h-64 animate-pulse rounded-xl border border-border/60 bg-surface-muted/50" />
            ) : (
              <TransactionsList transactions={txQ.data ?? []} />
            )}
          </div>
        </section>

        <footer className="mt-12 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground">
          StockLedger · shared inventory workspace
        </footer>
      </main>

      <Toaster richColors position="top-right" />
    </div>
  );
}
