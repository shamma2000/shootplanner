import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, FileText, Plus, ReceiptText } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { currentUserQuery } from "@/features/auth/auth-api";
import { EventCalendar } from "@/features/calendar/event-calendar";
import { RecordFilters } from "@/features/workspace/record-filters";
import { emptyRecordFilter, matchesRecordFilter } from "@/features/workspace/record-filter";
import {
  clientDisplayName,
  clientsQuery,
  eventsQuery,
  invoicesQuery,
  quotationsQuery,
} from "@/features/workspace/workspace-api";
import { formatDate, formatLkr } from "@/lib/format";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard - ShootPlanner.lk" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data: user } = useQuery(currentUserQuery);
  const clients = useQuery(clientsQuery);
  const events = useQuery(eventsQuery);
  const quotations = useQuery(quotationsQuery);
  const invoices = useQuery(invoicesQuery);
  const [filter, setFilter] = useState(emptyRecordFilter);
  const clientById = useMemo(
    () => new Map((clients.data ?? []).map((client) => [client.id, client])),
    [clients.data],
  );
  const eventById = useMemo(
    () => new Map((events.data ?? []).map((event) => [event.id, event])),
    [events.data],
  );
  const quotationRows = (quotations.data ?? []).map((quotation) => {
    const event = eventById.get(quotation.event_id);
    const client = event ? clientById.get(event.client_id) : undefined;
    return { quotation, event, client, date: event?.event_date ?? quotation.created_at };
  });
  const filtered = quotationRows.filter(({ quotation, client, date }) =>
    matchesRecordFilter(
      filter,
      [
        clientDisplayName(client),
        client?.primary_phone,
        client?.optional_phone,
        quotation.package_name,
      ].join(" "),
      date,
    ),
  );
  const collected = (invoices.data ?? []).reduce(
    (sum, invoice) =>
      sum + Number(invoice.status === "Paid" ? invoice.amount : invoice.advance_paid),
    0,
  );
  const quotedValue = (quotations.data ?? []).reduce((sum, item) => sum + Number(item.total), 0);
  const kpis = [
    {
      label: "Total quotations",
      value: quotations.data?.length ?? 0,
      pending: quotations.isPending,
      error: quotations.isError,
    },
    {
      label: "Confirmed events",
      value: events.data?.filter((item) => item.status === "Confirmed").length ?? 0,
      pending: events.isPending,
      error: events.isError,
    },
    {
      label: "Invoices",
      value: invoices.data?.length ?? 0,
      pending: invoices.isPending,
      error: invoices.isError,
    },
    {
      label: "Total collected",
      value: formatLkr(collected),
      pending: invoices.isPending,
      error: invoices.isError,
      money: true,
    },
    {
      label: "Total package value",
      value: formatLkr(quotedValue),
      pending: quotations.isPending,
      error: quotations.isError,
      money: true,
    },
  ];
  const pending = quotations.isPending || clients.isPending || events.isPending;
  const failed = quotations.isError || clients.isError || events.isError;

  return (
    <div className="studio-dashboard">
      <section className="studio-welcome">
        <div className="min-w-0">
          <h1 className="break-words text-3xl font-bold">{user?.studio_name ?? "Your studio"}</h1>
          <p className="mt-3 text-sm text-sidebar-muted">Welcome back, {user?.name}.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/dashboard/quotations/new">
              <Plus />
              Create New Quotation
            </Link>
          </Button>
          <Button asChild size="lg" variant="dark">
            <Link to="/dashboard/invoices">
              <ReceiptText />
              Invoices
            </Link>
          </Button>
        </div>
      </section>
      <section className="dashboard-stats" aria-label="Studio totals">
        {kpis.map((item) => (
          <article key={item.label} className="dashboard-stat">
            <h2>{item.label}</h2>
            <p className={item.money ? "stat-money" : ""} title={String(item.value)}>
              {item.error ? "Unavailable" : item.pending ? "..." : item.value}
            </p>
          </article>
        ))}
      </section>
      <div className="dashboard-workspace">
        <EventCalendar />
        <section className="dashboard-quotations" aria-label="Recent quotations">
          <div className="quotation-panel-header">
            <h2 className="text-lg font-bold">Quotations</h2>
            <RecordFilters
              label="Quotations"
              dates={quotationRows.map((row) => row.date)}
              onFilter={setFilter}
            />
          </div>
          {pending ? (
            <p role="status" className="workspace-empty">
              Loading quotations...
            </p>
          ) : failed ? (
            <p role="alert" className="workspace-empty text-destructive">
              Unable to load quotations.
            </p>
          ) : filtered.length === 0 ? (
            <div className="workspace-empty">
              <FileText className="mb-5 size-10 text-muted-foreground/40" strokeWidth={1.5} />
              <p>No quotations found.</p>
              <Link
                to="/dashboard/quotations/new"
                className="mt-4 inline-flex items-center gap-2 font-medium text-primary-strong"
              >
                Create your first quotation
                <ArrowRight className="size-4" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(({ quotation, event, client }) => (
                <Link key={quotation.id} to="/dashboard/quotations" className="quotation-summary">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{clientDisplayName(client)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {event?.event_type ?? "Quotation"}
                      {event ? ` - ${formatDate(event.event_date)}` : ""}
                    </p>
                    <span className="mt-2 block text-xs text-muted-foreground">
                      {quotation.status}
                    </span>
                  </div>
                  <span className="text-right text-sm font-semibold">
                    {formatLkr(quotation.total)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
