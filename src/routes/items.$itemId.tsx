import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Boxes, Layers, PackageCheck, Wallet, TrendingUp } from "lucide-react";
import {
  fetchItem,
  fetchBatches,
  formatCurrency,
  formatNumber,
} from "@/lib/inventory";
import { BatchCard } from "@/components/inventory/BatchCard";
import { StatCard } from "@/components/inventory/StatCard";
import { RecordTransactionDialog } from "@/components/inventory/RecordTransactionDialog";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/items/$itemId")({
  head: () => ({
    meta: [{ title: "Stock item history — StockLedger" }],
  }),
  component: ItemDetailPage,
  errorComponent: ({ error }) => (
    <div className="p-10 text-sm text-destructive">Failed to load item: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-10">Item not found.</div>,
});

function ItemDetailPage() {
  const { itemId } = Route.useParams();
  const itemQ = useQuery({ queryKey: ["item", itemId], queryFn: () => fetchItem(itemId) });
  const batchesQ = useQuery({ queryKey: ["batches", itemId], queryFn: () => fetchBatches(itemId) });

  const item = itemQ.data;
  const batches = batchesQ.data ?? [];

  const totalQty = batches.reduce((s, b) => s + Number(b.quantity), 0);
  const totalSpent = batches.reduce((s, b) => s + Number(b.total_price), 0);
  const avgUnit = totalQty > 0 ? totalSpent / totalQty : 0;
  const latest = batches[0];

  const purchases = batches.filter((b) => !b.is_opening_stock);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <header className="border-b border-border/60 bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-10">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> <span className="hidden xs:inline sm:inline">Back to inventory</span><span className="xs:hidden sm:hidden">Back</span>
          </Link>
          {item && (
            <RecordTransactionDialog
              items={[item]}
              defaultItemId={item.id}
              defaultType="purchase"
            />
          )}
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        {itemQ.isLoading ? (
          <div className="h-32 animate-pulse rounded-xl bg-surface-muted/50" />
        ) : item ? (
          <>
            <section className="mb-6 flex items-start gap-3 sm:mb-8 sm:gap-4">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-primary-foreground shadow-[var(--shadow-soft)] sm:h-12 sm:w-12"
                style={{ background: "var(--gradient-hero)" }}
              >
                <Boxes className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">{item.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Full purchase history — each batch is kept separately with its own price.
                </p>
              </div>
            </section>

            <section className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-4">
              <StatCard
                label="Remaining quantity"
                value={`${formatNumber(item.current_quantity)} ${item.unit}`}
                hint="On the shelf right now"
                icon={PackageCheck}
                tone="primary"
              />
              <StatCard
                label="Total ever purchased"
                value={`${formatNumber(totalQty)} ${item.unit}`}
                hint={`${batches.length} batch${batches.length === 1 ? "" : "es"}`}
                icon={Layers}
                tone="accent"
              />
              <StatCard
                label="Total spent"
                value={formatCurrency(totalSpent)}
                hint="Across all batches"
                icon={Wallet}
                tone="success"
              />
              <StatCard
                label="Latest / avg unit price"
                value={formatCurrency(latest?.unit_price ?? 0)}
                hint={`Avg ${formatCurrency(avgUnit)}`}
                icon={TrendingUp}
                tone="warning"
              />
            </section>

            <section>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-lg font-semibold tracking-tight">Batches</h2>
                <p className="text-xs text-muted-foreground">Newest on top</p>
              </div>

              {batchesQ.isLoading ? (
                <div className="h-40 animate-pulse rounded-xl bg-surface-muted/50" />
              ) : batches.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
                  No batches yet. Record a purchase to add one.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {batches.map((b) => (
                    <BatchCard
                      key={b.id}
                      batch={b}
                      index={purchases.length - purchases.findIndex((p) => p.id === b.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
