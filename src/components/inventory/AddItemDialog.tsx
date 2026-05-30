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
import { createItem } from "@/lib/inventory";

export function AddItemDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    unit: "unit",
    unit_price: "",
    current_quantity: "",
    low_stock_threshold: "0",
  });
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () =>
      createItem({
        name: form.name,
        sku: form.sku,
        unit: form.unit,
        unit_price: Number(form.unit_price) || 0,
        current_quantity: Number(form.current_quantity) || 0,
        low_stock_threshold: Number(form.low_stock_threshold) || 0,
      }),
    onSuccess: () => {
      toast.success("Item added to inventory");
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      setForm({ name: "", sku: "", unit: "unit", unit_price: "", current_quantity: "", low_stock_threshold: "0" });
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
            Create a product entry with its unit price and starting quantity.
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
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. A4 Printer Paper" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="sku">SKU / Code</Label>
              <Input id="sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="optional" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="box, kg, pcs" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="price">Unit price *</Label>
              <Input id="price" inputMode="decimal" type="number" step="0.01" min="0" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} placeholder="0.00" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="qty">Starting quantity</Label>
              <Input id="qty" inputMode="decimal" type="number" step="0.01" min="0" value={form.current_quantity} onChange={(e) => setForm({ ...form, current_quantity: e.target.value })} placeholder="0" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="threshold">Low-stock alert threshold</Label>
            <Input id="threshold" inputMode="decimal" type="number" step="0.01" min="0" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} />
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
