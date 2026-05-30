import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { recordTransaction, type StockItem, type TransactionType } from "@/lib/inventory";

type Props = {
  items: StockItem[];
  defaultItemId?: string;
  trigger?: React.ReactNode;
  defaultType?: TransactionType;
};

export function RecordTransactionDialog({ items, defaultItemId, trigger, defaultType = "purchase" }: Props) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TransactionType>(defaultType);
  const [itemId, setItemId] = useState(defaultItemId ?? "");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [note, setNote] = useState("");
  const qc = useQueryClient();

  const selected = items.find((i) => i.id === itemId);

  const mutation = useMutation({
    mutationFn: () =>
      recordTransaction({
        item_id: itemId,
        type,
        quantity: Number(quantity),
        unit_price: Number(unitPrice),
        note,
      }),
    onSuccess: () => {
      toast.success("Transaction recorded");
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      setQuantity("");
      setUnitPrice("");
      setNote("");
      setOpen(false);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to record transaction"),
  });

  function onOpenChange(o: boolean) {
    setOpen(o);
    if (o) {
      setType(defaultType);
      setItemId(defaultItemId ?? "");
      setQuantity("");
      setUnitPrice("");
      setNote("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="secondary" className="gap-2">
            <ArrowLeftRight className="h-4 w-4" /> Record Transaction
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record stock transaction</DialogTitle>
          <DialogDescription>
            Log a purchase of new goods, a sale, or an adjustment. Stock levels update automatically.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!itemId) return toast.error("Select an item");
            if (!quantity || Number(quantity) === 0) return toast.error("Enter a quantity");
            mutation.mutate();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as TransactionType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase">Purchase (stock in)</SelectItem>
                  <SelectItem value="sale">Sale (stock out)</SelectItem>
                  <SelectItem value="adjustment">Adjustment (±)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Item</Label>
              <Select value={itemId} onValueChange={(v) => {
                setItemId(v);
                const it = items.find((i) => i.id === v);
                if (it && !unitPrice) setUnitPrice(String(it.unit_price));
              }}>
                <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                <SelectContent>
                  {items.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name} {i.sku ? `· ${i.sku}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="q">Quantity {selected ? `(${selected.unit})` : ""}</Label>
              <Input id="q" type="number" inputMode="decimal" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder={type === "adjustment" ? "use negative for loss" : "0"} />
              {type === "adjustment" && (
                <p className="text-xs text-muted-foreground">Use a negative number for losses or damage.</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p">Unit price</Label>
              <Input id="p" type="number" inputMode="decimal" step="0.01" min="0" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} placeholder="0.00" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="note">Note</Label>
            <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Supplier, invoice no., reason…" rows={2} />
          </div>

          {quantity && unitPrice && (
            <div className="rounded-lg bg-muted/60 px-4 py-2.5 text-sm">
              <span className="text-muted-foreground">Total: </span>
              <span className="font-semibold tabular">
                {formatCurrency(Number(quantity) * Number(unitPrice))}
              </span>
            </div>
          )}

          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Record transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
