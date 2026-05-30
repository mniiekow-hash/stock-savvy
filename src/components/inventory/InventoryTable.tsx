import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowUpFromLine, Package, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { deleteItem, formatCurrency, formatNumber, type StockItem } from "@/lib/inventory";
import { RecordTransactionDialog } from "./RecordTransactionDialog";

export function InventoryTable({ items }: { items: StockItem[] }) {
  const [q, setQ] = useState("");
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: (id: string) => deleteItem(id),
    onSuccess: () => {
      toast.success("Item removed");
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to delete"),
  });

  const filtered = items.filter((i) => {
    const s = q.toLowerCase();
    return !s || i.name.toLowerCase().includes(s) || (i.sku ?? "").toLowerCase().includes(s);
  });

  return (
    <Card className="overflow-hidden border-border/60 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col gap-3 border-b border-border/60 bg-surface-muted/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Stock on hand</h2>
          <p className="text-xs text-muted-foreground">
            {items.length} item{items.length === 1 ? "" : "s"} tracked
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or SKU…"
            className="pl-9 bg-surface"
          />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Package className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold">No stock items yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Add your first item to start tracking quantities, prices, and movements.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-muted/40">
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Unit price</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Stock value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((it) => {
                const value = it.current_quantity * it.unit_price;
                const low = it.current_quantity <= it.low_stock_threshold;
                const empty = it.current_quantity <= 0;
                return (
                  <TableRow key={it.id} className="group">
                    <TableCell>
                      <div className="font-medium text-foreground">{it.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {it.sku ? `${it.sku} · ` : ""}per {it.unit}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular">{formatCurrency(it.unit_price)}</TableCell>
                    <TableCell className="text-right tabular font-medium">
                      {formatNumber(it.current_quantity)} <span className="text-muted-foreground font-normal">{it.unit}</span>
                    </TableCell>
                    <TableCell className="text-right tabular font-semibold">{formatCurrency(value)}</TableCell>
                    <TableCell>
                      {empty ? (
                        <Badge variant="destructive">Out of stock</Badge>
                      ) : low ? (
                        <Badge className="bg-warning text-warning-foreground hover:bg-warning/90">Low</Badge>
                      ) : (
                        <Badge className="bg-success/15 text-success hover:bg-success/20">In stock</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1.5 opacity-80 transition-opacity group-hover:opacity-100">
                        <RecordTransactionDialog
                          items={items}
                          defaultItemId={it.id}
                          defaultType="purchase"
                          trigger={
                            <Button size="sm" variant="ghost" className="gap-1.5 text-success hover:bg-success/10 hover:text-success">
                              <ArrowDownToLine className="h-3.5 w-3.5" /> Buy in
                            </Button>
                          }
                        />
                        <RecordTransactionDialog
                          items={items}
                          defaultItemId={it.id}
                          defaultType="sale"
                          trigger={
                            <Button size="sm" variant="ghost" className="gap-1.5 hover:bg-primary/10 hover:text-primary">
                              <ArrowUpFromLine className="h-3.5 w-3.5" /> Sell
                            </Button>
                          }
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => {
                            if (confirm(`Delete "${it.name}"? This removes its transaction history too.`)) {
                              del.mutate(it.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
