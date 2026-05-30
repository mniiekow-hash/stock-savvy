import { Archive, PackagePlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber, type StockBatch } from "@/lib/inventory";

export function BatchCard({ batch, index }: { batch: StockBatch; index: number }) {
  const date = new Date(batch.created_at);
  const isOpening = batch.is_opening_stock;
  const Icon = isOpening ? Archive : PackagePlus;
  const unitLabel = batch.pack_unit.replace(/s$/, "");

  return (
    <Card className="overflow-hidden border-border/60 shadow-[var(--shadow-soft)]">
      <div
        className={`flex items-center justify-between gap-3 border-b border-border/60 px-5 py-3 ${
          isOpening ? "bg-warning/10" : "bg-success/10"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              isOpening ? "bg-warning/20 text-warning-foreground" : "bg-success/20 text-success"
            }`}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight">
              {isOpening ? "Opening stock" : `Purchase #${index}`}
            </h3>
            <p className="text-xs text-muted-foreground">
              {date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
        </div>
        {isOpening && (
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
            Old stock
          </Badge>
        )}
      </div>

      <dl className="grid grid-cols-1 divide-y divide-border/60">
        <Row label="Quantity" value={`${formatNumber(batch.quantity)} ${batch.pack_unit}`} />
        <Row label="Total price" value={formatCurrency(batch.total_price)} />
        <Row
          label="Unit price"
          value={`${formatCurrency(batch.unit_price)} / ${unitLabel}`}
          emphasize
        />
        {batch.note && <Row label="Note" value={batch.note} muted />}
      </dl>
    </Card>
  );
}

function Row({
  label,
  value,
  emphasize,
  muted,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd
        className={`tabular text-sm ${emphasize ? "font-bold text-primary" : "font-medium"} ${
          muted ? "text-muted-foreground text-right max-w-[60%]" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
