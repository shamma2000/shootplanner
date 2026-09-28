import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { FileCheck2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageIntro } from "@/components/layout/app-shell";
import { Input } from "@/components/ui/input";
import {
  clientDisplayName,
  clientsQuery,
  eventsQuery,
  invoicesQuery,
  quotationsQuery,
  updateDelivery,
  type DeliveryStatus,
} from "@/features/workspace/workspace-api";
import { ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/dashboard/deliveries")({
  head: () => ({
    meta: [
      { title: "Deliveries - ShootPlanner.lk" },
      { name: "description", content: "Track client deliverables." },
    ],
  }),
  component: Page,
});

function Page() {
  const clients = useQuery(clientsQuery);
  const events = useQuery(eventsQuery);
  const quotations = useQuery(quotationsQuery);
  const invoices = useQuery(invoicesQuery);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<DeliveryStatus | "All">("All");
  const clientById = useMemo(
    () => new Map((clients.data ?? []).map((client) => [client.id, client])),
    [clients.data],
  );
  const eventById = useMemo(
    () => new Map((events.data ?? []).map((event) => [event.id, event])),
    [events.data],
  );
  const quotationById = useMemo(
    () => new Map((quotations.data ?? []).map((quotation) => [quotation.id, quotation])),
    [quotations.data],
  );
  const rows = useMemo(
    () =>
      (invoices.data ?? []).flatMap((invoice) => {
        const quotation = quotationById.get(invoice.quotation_id);
        const event = quotation ? eventById.get(quotation.event_id) : undefined;
        const client = event ? clientById.get(event.client_id) : undefined;
        const clientName = clientDisplayName(client);
        return invoice.deliveries.map((delivery) => ({
          delivery,
          invoiceNumber: invoice.invoice_number,
          clientName,
          event,
        }));
      }),
    [clientById, eventById, invoices.data, quotationById],
  );
  const filtered = rows.filter((row) => {
    const matchesStatus = status === "All" || row.delivery.status === status;
    const needle = search.toLowerCase();
    return (
      matchesStatus &&
      `${row.delivery.name} ${row.clientName} ${row.invoiceNumber}`.toLowerCase().includes(needle)
    );
  });
  const save = useMutation({
    mutationFn: ({ id, next }: { id: string; next: DeliveryStatus }) => updateDelivery(id, next),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["workspace", "invoices"] });
      toast.success("Delivery updated");
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Unable to update delivery"),
  });
  const pending =
    clients.isPending || events.isPending || quotations.isPending || invoices.isPending;
  const failed = clients.isError || events.isError || quotations.isError || invoices.isError;

  return (
    <>
      <PageIntro
        title="Deliveries"
        description="Track the albums, edits, videos, and other work promised to each client."
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search client, invoice, or deliverable"
            className="pl-9"
          />
        </label>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as DeliveryStatus | "All")}
          className={selectClass}
        >
          <option>All</option>
          <option>Pending</option>
          <option>In Progress</option>
          <option>Delivered</option>
        </select>
      </div>
      {pending && <StateText>Loading deliveries...</StateText>}
      {failed && <StateText error>Unable to load deliveries.</StateText>}
      {!pending && !failed && filtered.length === 0 && (
        <div className="rounded-lg border border-dashed border-border px-5 py-12 text-center">
          <FileCheck2 className="mx-auto size-7 text-muted-foreground" />
          <p className="mt-3 text-sm font-bold">No matching deliveries</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Delivery tasks are created when a quotation with deliverables becomes an invoice.
          </p>
        </div>
      )}
      {filtered.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="hidden grid-cols-[1.4fr_1fr_1fr_1fr_170px] gap-4 border-b border-border bg-muted px-5 py-3 text-xs font-bold text-muted-foreground md:grid">
            <span>Deliverable</span>
            <span>Client</span>
            <span>Event</span>
            <span>Due</span>
            <span>Status</span>
          </div>
          {filtered.map((row) => (
            <div
              key={row.delivery.id}
              className="grid gap-3 border-b border-border px-5 py-4 last:border-0 md:grid-cols-[1.4fr_1fr_1fr_1fr_170px] md:items-center md:gap-4"
            >
              <div>
                <p className="text-sm font-bold">{row.delivery.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{row.invoiceNumber}</p>
              </div>
              <span className="text-sm">{row.clientName}</span>
              <span className="text-sm text-muted-foreground">
                {row.event ? `${row.event.event_type} · ${formatDate(row.event.event_date)}` : "-"}
              </span>
              <span className="text-sm text-muted-foreground">
                {row.delivery.due_date ? formatDate(row.delivery.due_date) : "Not set"}
              </span>
              <select
                value={row.delivery.status}
                disabled={save.isPending}
                onChange={(event) =>
                  save.mutate({
                    id: row.delivery.id,
                    next: event.target.value as DeliveryStatus,
                  })
                }
                className={selectClass}
              >
                <option>Pending</option>
                <option>In Progress</option>
                <option>Delivered</option>
              </select>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function StateText({ children, error = false }: { children: string; error?: boolean }) {
  return (
    <p
      className={`py-10 text-center text-sm ${error ? "font-semibold text-destructive" : "text-muted-foreground"}`}
    >
      {children}
    </p>
  );
}

const selectClass =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring";
