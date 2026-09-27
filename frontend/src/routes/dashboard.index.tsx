import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FileText,
  Plus,
  ReceiptText,
  Search,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { events, formatLkr } from "@/data/mock";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [
      { title: "Dashboard — ShootPlanner.lk" },
      {
        name: "description",
        content: "Romance Studio’s quotations, events, invoices, and financial overview.",
      },
      { property: "og:title", content: "Studio Dashboard — ShootPlanner.lk" },
      {
        property: "og:description",
        content: "Manage every part of your photography studio in one workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

const kpis = [
  { label: "Total quotations", value: "3", note: "7 remaining", icon: FileText },
  { label: "Confirmed", value: "1", note: "This month", icon: CheckCircle2 },
  { label: "Invoices", value: "2", note: "8 remaining", icon: ReceiptText },
  { label: "Total collected", value: formatLkr(480000), note: "+12.5%", icon: WalletCards },
  { label: "Package value", value: formatLkr(720000), note: "Active bookings", icon: Sparkles },
];
const names: Record<string, string> = {
  "cli-1": "Dinithi & Kasun",
  "cli-2": "Yasara & Thisal",
  "cli-3": "Maneesha & Ravindu",
};
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${Number(d)} ${months[Number(m) - 1]} ${y}`;
};

function DashboardPage() {
  const today = new Date().toISOString().slice(0, 10);
  const nextEvent = [...events]
    .sort((a, b) => a.date.localeCompare(b.date))
    .find((e) => e.date >= today);
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-xl bg-sidebar p-6 text-on-dark shadow-soft md:p-9">
        <div className="absolute right-0 top-0 size-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="mb-3 text-sm font-bold text-primary">Welcome back, Romance</p>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Your studio, beautifully organized.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-sidebar-muted">
            Create and manage professional quotations for photography and videography services.
          </p>
          {nextEvent && (
            <div className="mt-6 inline-flex max-w-full items-center gap-3 rounded-lg border border-on-dark/15 bg-on-dark/5 px-4 py-3">
              <CalendarDays className="size-4 shrink-0 text-primary" />
              <p className="truncate text-sm text-sidebar-muted">
                Next event:{" "}
                <span className="font-bold text-on-dark">
                  {nextEvent.type} · {names[nextEvent.clientId]}
                </span>
                <span className="ml-2 font-bold text-primary">{formatDate(nextEvent.date)}</span>
              </p>
            </div>
          )}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/dashboard/quotations/new">
                <Plus />
                Create new quotation
              </Link>
            </Button>
            <Button variant="dark" size="lg" asChild>
              <Link to="/dashboard/invoices">
                <ReceiptText />
                Create invoice
              </Link>
            </Button>
          </div>
        </div>
      </section>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map(({ label, value, note, icon: Icon }) => (
          <article key={label} className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-start justify-between">
              <div className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary-strong">
                <Icon className="size-4" />
              </div>
              <span className="text-xs font-bold text-primary-strong">{note}</span>
            </div>
            <p className="mt-5 text-xs font-semibold text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-extrabold tracking-tight text-foreground">{value}</p>
          </article>
        ))}
      </section>
      <section className="rounded-xl border border-border bg-card p-4 shadow-soft md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-lg font-extrabold text-foreground">Event overview</p>
            <p className="mt-1 text-sm text-muted-foreground">Your next shoots and celebrations.</p>
          </div>
          <Button asChild>
            <Link to="/dashboard/calendar">
              <Plus />
              Add event
            </Link>
          </Button>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input className="bg-muted pl-9" placeholder="Search clients or locations" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {["All", "Wedding", "Pre-shoot", "Engagement", "Draft", "Confirmed"].map(
              (chip, index) => (
                <button
                  key={chip}
                  className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold ${index === 0 ? "bg-sidebar text-on-dark" : "bg-muted text-muted-foreground hover:bg-primary-soft hover:text-primary-strong"}`}
                >
                  {chip}
                </button>
              ),
            )}
          </div>
        </div>
        <div className="mt-5 divide-y divide-border">
          {events.map((event) => (
            <div
              key={event.id}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-4"
            >
              <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary-strong">
                <CalendarDays className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">
                  {names[event.clientId]}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {event.type} · {event.location} · {event.date}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="hidden rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground sm:block">
                  {event.status}
                </span>
                <ArrowRight className="size-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
