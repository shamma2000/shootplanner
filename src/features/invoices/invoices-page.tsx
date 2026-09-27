import { Download, Plus, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageIntro } from "@/components/layout/app-shell";
import { formatLkr } from "@/data/mock";
const rows = [
  ["INV-2026-028", "Dinithi & Kasun", "Sep 18, 2026", 180000, "Paid"],
  ["INV-2026-029", "Maneesha & Ravindu", "Sep 21, 2026", 125000, "Pending"],
  ["INV-2026-030", "Yasara & Thisal", "Sep 22, 2026", 95000, "Overdue"],
] as const;
export function InvoicesPage() {
  return (
    <>
      <PageIntro
        title="Invoices"
        description="Send professional invoices and know exactly what has been paid."
        action={
          <Button>
            <Plus />
            New invoice
          </Button>
        }
      />
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        <div className="hidden grid-cols-[1fr_1.5fr_1fr_1fr_auto] gap-4 border-b border-border bg-muted px-5 py-3 text-xs font-bold text-muted-foreground md:grid">
          <span>Invoice</span>
          <span>Client</span>
          <span>Issued</span>
          <span>Amount</span>
          <span>Status</span>
        </div>
        {rows.map(([id, client, date, amount, status]) => (
          <div
            key={id}
            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 border-b border-border p-5 last:border-0 md:grid-cols-[1fr_1.5fr_1fr_1fr_auto]"
          >
            <ReceiptText className="size-5 text-primary-strong md:hidden" />
            <span className="hidden text-sm font-bold md:block">{id}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold md:font-semibold">{client}</p>
              <p className="mt-1 text-xs text-muted-foreground md:hidden">
                {id} · {date} · {formatLkr(amount)}
              </p>
            </div>
            <span className="hidden text-sm text-muted-foreground md:block">{date}</span>
            <span className="hidden text-sm font-bold md:block">{formatLkr(amount)}</span>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${status === "Paid" ? "bg-emerald-100 text-emerald-700" : status === "Pending" ? "bg-primary-soft text-primary-strong" : "bg-red-100 text-red-700"}`}
              >
                {status}
              </span>
              <Button variant="ghost" size="icon" aria-label="Download invoice">
                <Download />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
