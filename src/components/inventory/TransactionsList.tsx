import { ArrowDownToLine, ArrowUpFromLine, Sliders } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatNumber, type StockTransaction } from "@/lib/inventory";

type Row = StockTransaction & { stock_items: { name: string; unit: string } | null };

const typeMeta = {
  purchase: { label: "Purchase", icon: ArrowDownToLine, tone: "bg-success/15 text-success" },
  sale: { label: "Sale", icon: ArrowUpFromLine, tone: "bg-primary/10 text-primary" },
  adjustment: { label: "Adjustment", icon: Sliders, tone: "bg-warning/20 text-warning-foreground" },
} as const;

export function TransactionsList({ transactions }: { transactions: Row[] }) {
  return (
    <Card className="overflow-hidden border-border/60 shadow-[var(--shadow-soft)]">
      <div className="border-b border-border/60 bg-surface-muted/60 px-4 py-3 sm:px-5 sm:py-4">
        <h2 className="text-base font-semibold tracking-tight">Recent activity</h2>
        <p className="text-xs text-muted-foreground">Latest stock movements</p>
      </div>
      {transactions.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-muted-foreground">
          No transactions yet. Record a purchase or sale to see it here.
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {transactions.map((t) => {
            const meta = typeMeta[t.type];
            const Icon = meta.icon;
            const date = new Date(t.created_at);
            return (
              <li key={t.id} className="flex items-start gap-3 px-4 py-3 sm:px-5 sm:py-3.5">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.tone}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">
                      {t.stock_items?.name ?? "Unknown item"}
                    </p>
                    <span className="shrink-0 text-sm font-semibold tabular">
                      {t.type === "sale" ? "−" : t.type === "adjustment" && t.quantity < 0 ? "" : "+"}
                      {formatNumber(Math.abs(t.quantity))} {t.stock_items?.unit ?? ""}
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
                    <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                      {meta.label} · {date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                      {t.note ? ` · ${t.note}` : ""}
                    </p>
                    <span className="shrink-0 text-xs tabular text-muted-foreground">
                      {formatCurrency(t.total_amount)}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
