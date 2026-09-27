import { createFileRoute } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, WalletCards } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageIntro } from "@/components/layout/app-shell";
import { formatLkr } from "@/data/mock";
export const Route = createFileRoute("/dashboard/finance")({
  head: () => ({
    meta: [
      { title: "Finance — ShootPlanner.lk" },
      { name: "description", content: "Track studio income, expenses, and net profit." },
      { property: "og:title", content: "Studio Finance — ShootPlanner.lk" },
      { property: "og:description", content: "Understand studio cash flow and spending." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
const cash = [
  { m: "Apr", i: 6200, e: 3100 },
  { m: "May", i: 7800, e: 3900 },
  { m: "Jun", i: 7100, e: 4200 },
  { m: "Jul", i: 9600, e: 3800 },
  { m: "Aug", i: 10800, e: 4600 },
  { m: "Sep", i: 12480, e: 4320 },
];
const stats: Array<{ label: string; value: number; icon: LucideIcon; color: string }> = [
  { label: "Total income", value: 12480, icon: ArrowUpRight, color: "text-emerald-600" },
  { label: "Total expenses", value: 4320, icon: ArrowDownRight, color: "text-red-600" },
  { label: "Net profit", value: 8160, icon: WalletCards, color: "text-primary-strong" },
];
const spend = [
  { name: "Equipment", value: 38, fill: "var(--chart-1)" },
  { name: "Travel", value: 22, fill: "var(--chart-2)" },
  { name: "Studio rent", value: 15, fill: "var(--chart-3)" },
  { name: "Marketing", value: 10, fill: "var(--chart-4)" },
  { name: "Other", value: 15, fill: "var(--chart-5)" },
];
function Page() {
  return (
    <>
      <PageIntro
        title="Financial tracking"
        description="A clear view of studio income, spending, and profit."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <article key={label} className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-muted-foreground">{String(label)}</p>
              <Icon className={`size-5 ${color}`} />
            </div>
            <p className="mt-4 text-2xl font-extrabold">{formatLkr(Number(value))}</p>
          </article>
        ))}
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-extrabold">Cash flow</h2>
          <p className="mt-1 text-xs text-muted-foreground">Income versus expenses</p>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cash}>
                <defs>
                  <linearGradient id="inc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="m" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="i"
                  stroke="var(--primary-strong)"
                  fill="url(#inc)"
                  strokeWidth={3}
                />
                <Area
                  type="monotone"
                  dataKey="e"
                  stroke="var(--muted-foreground)"
                  fill="transparent"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-extrabold">Expense breakdown</h2>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={spend}
                  dataKey="value"
                  innerRadius={58}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {spend.map((item) => (
                    <Cell key={item.name} fill={item.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {spend.map((item) => (
              <p key={item.name} className="text-xs text-muted-foreground">
                <span className="font-bold text-foreground">{item.value}%</span> {item.name}
              </p>
            ))}
          </div>
        </section>
      </div>
      <section className="mt-5 rounded-xl border border-border bg-card p-5 shadow-soft">
        <h2 className="font-extrabold">Recent transactions</h2>
        <div className="mt-4 divide-y divide-border">
          {[
            ["Wedding advance · Dinithi & Kasun", "Income", 7500],
            ["Camera lens service", "Expense", 820],
            ["Studio rent · September", "Expense", 1500],
          ].map(([name, type, value]) => (
            <div key={String(name)} className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{name}</p>
                <p className="text-xs text-muted-foreground">Sep 2026</p>
              </div>
              <p
                className={`shrink-0 text-sm font-extrabold ${type === "Income" ? "text-emerald-600" : "text-red-600"}`}
              >
                {type === "Income" ? "+" : "−"} {formatLkr(Number(value))}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
