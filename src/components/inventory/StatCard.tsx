import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

type Props = {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "primary" | "accent" | "success" | "warning";
};

const toneMap = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/15 text-accent",
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning-foreground",
} as const;

export function StatCard({ label, value, hint, icon: Icon, tone = "primary" }: Props) {
  return (
    <Card className="p-3 shadow-[var(--shadow-soft)] border-border/60 sm:p-5">
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:text-xs">
            {label}
          </p>
          <p className="mt-1.5 break-words text-xl font-semibold tracking-tight tabular text-foreground sm:mt-2 sm:text-3xl">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">{hint}</p>
          ) : null}
        </div>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${toneMap[tone]}`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
    </Card>
  );
}
