import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createItemWithOpening, formatCurrency, PACK_UNITS } from "@/lib/inventory";

export function AddItemDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    low_stock_threshold: "0",
    opening_quantity: "",
    pack_unit: "crates",
    opening_total_price: "",
  });
  const qc = useQueryClient();

  const qty = Number(form.opening_quantity) || 0;
  const tot = Number(form.opening_total_price) || 0;
  const unitPrice = qty > 0 ? tot / qty : 0;

  const mutation = useMutation({
    mutationFn: () =>
      createItemWithOpening({
        name: form.name,
        low_stock_threshold: Number(form.low_stock_threshold) || 0,
        opening_quantity: qty,
        pack_unit: form.pack_unit,
        opening_total_price: tot,
      }),
    onSuccess: () => {
      toast.success("Item added to inventory");
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["batches"] });
      setForm({
        name: "",
        low_stock_threshold: "0",
        opening_quantity: "",
        pack_unit: "crates",
        opening_total_price: "",
      });
      setOpen(false);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to add item"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Add Stock Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a new stock item</DialogTitle>
          <DialogDescription>
            Create the product and record the stock already in the warehouse (opening stock) with its
            total price.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name.trim()) return toast.error("Item name is required");
            mutation.mutate();
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="name">Item name *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Minerals (Soft drinks)"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="threshold">Low-stock alert threshold</Label>
            <Input
              id="threshold"
              inputMode="decimal"
              type="number"
              step="0.01"
              min="0"
              value={form.low_stock_threshold}
              onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Get warned when remaining quantity falls to or below this number.
            </p>
          </div>

          <div className="rounded-lg border border-border/60 bg-surface-muted/40 p-4">
            <h4 className="text-sm font-semibold">Opening stock (old stock in warehouse)</h4>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Leave blank if there's no existing stock yet.
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="qty">Quantity</Label>
                <Input
                  id="qty"
                  inputMode="decimal"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.opening_quantity}
                  onChange={(e) => setForm({ ...form, opening_quantity: e.target.value })}
                  placeholder="e.g. 4"
                />
              </div>
              <div className="grid gap-2">
                <Label>Pack unit</Label>
                <Select
                  value={form.pack_unit}
                  onValueChange={(v) => setForm({ ...form, pack_unit: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PACK_UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-3 grid gap-2">
              <Label htmlFor="total">Total price (₵)</Label>
              <Input
                id="total"
                inputMode="decimal"
                type="number"
                step="0.01"
                min="0"
                value={form.opening_total_price}
                onChange={(e) => setForm({ ...form, opening_total_price: e.target.value })}
                placeholder="e.g. 160.00"
              />
              {qty > 0 && tot > 0 && (
                <p className="text-xs text-muted-foreground">
                  Unit price: <span className="font-semibold text-foreground">{formatCurrency(unitPrice)}</span> per {form.pack_unit.replace(/s$/, "")}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
