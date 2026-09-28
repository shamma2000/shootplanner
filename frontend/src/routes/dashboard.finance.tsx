import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { CircleDollarSign, Clock3, WalletCards } from "lucide-react";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageIntro } from "@/components/layout/app-shell";
import { invoicesQuery } from "@/features/workspace/workspace-api";
import { formatDate, formatLkr } from "@/lib/format";

export const Route = createFileRoute("/dashboard/finance")({
  head: () => ({
    meta: [
      { title: "Finance - ShootPlanner.lk" },
      { name: "description", content: "Track invoiced, collected, and outstanding revenue." },
    ],
  }),
  component: Page,
});

function Page() {
  const invoices = useQuery(invoicesQuery);
  const totalInvoiced = (invoices.data ?? []).reduce(
    (sum, invoice) => sum + Number(invoice.amount),
    0,
  );
  const totalCollected = (invoices.data ?? [])
    .filter((invoice) => invoice.status === "Paid")
    .reduce((sum, invoice) => sum + Number(invoice.amount), 0);
  const outstanding = totalInvoiced - totalCollected;
  const stats: Array<{ label: string; value: number; icon: LucideIcon; color: string }> = [
    {
      label: "Total invoiced",
      value: totalInvoiced,
      icon: CircleDollarSign,
      color: "text-primary-strong",
    },
    {
      label: "Total collected",
      value: totalCollected,
      icon: WalletCards,
      color: "text-emerald-600",
    },
    { label: "Outstanding", value: outstanding, icon: Clock3, color: "text-amber-700" },
  ];
  const monthly = useMemo(() => {
    const values = new Map<string, { month: string; invoiced: number; collected: number }>();
    for (const invoice of invoices.data ?? []) {
      const date = new Date(invoice.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const entry = values.get(key) ?? {
        month: date.toLocaleDateString("en-LK", { month: "short", year: "2-digit" }),
        invoiced: 0,
        collected: 0,
      };
      entry.invoiced += Number(invoice.amount);
      if (invoice.status === "Paid") entry.collected += Number(invoice.amount);
      values.set(key, entry);
    }
    return [...values.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, value]) => value);
  }, [invoices.data]);

  return (
    <>
      <PageIntro
        title="Financial tracking"
        description="A live view of revenue recorded in your invoices."
      />
      {invoices.isPending && (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading financial data...</p>
      )}
      {invoices.isError && (
        <p className="py-10 text-center text-sm font-semibold text-destructive">
          Unable to load financial data.
        </p>
      )}
      {!invoices.isPending && !invoices.isError && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {stats.map(({ label, value, icon: Icon, color }) => (
              <article
                key={label}
                className="rounded-xl border border-border bg-card p-5 shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-muted-foreground">{label}</p>
                  <Icon className={`size-5 ${color}`} />
                </div>
                <p className="mt-4 text-2xl font-extrabold">{formatLkr(value)}</p>
              </article>
            ))}
          </div>
          <section className="mt-5 rounded-xl border border-border bg-card p-5 shadow-soft">
            <h2 className="font-extrabold">Invoice history</h2>
            <p className="mt-1 text-xs text-muted-foreground">Invoiced versus collected revenue</p>
            {monthly.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                No invoice data to chart yet.
              </p>
            ) : (
              <div className="mt-5 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatLkr(Number(value))} />
                    <Area
                      type="monotone"
                      dataKey="invoiced"
                      stroke="var(--primary-strong)"
                      fill="var(--primary-soft)"
                      strokeWidth={3}
                    />
                    <Area
                      type="monotone"
                      dataKey="collected"
                      stroke="#059669"
                      fill="transparent"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
          <section className="mt-5 rounded-xl border border-border bg-card p-5 shadow-soft">
            <h2 className="font-extrabold">Recent invoices</h2>
            <div className="mt-4 divide-y divide-border">
              {(invoices.data ?? []).slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{invoice.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">
                      Due {formatDate(invoice.due_date)} - {invoice.status}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-extrabold">{formatLkr(invoice.amount)}</p>
                </div>
              ))}
              {invoices.data?.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No invoices yet.</p>
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
}
