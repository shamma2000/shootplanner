import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Download, FileText, Plus, ReceiptText, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageIntro } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  clientDisplayName,
  clientsQuery,
  convertQuotationToInvoice,
  eventsQuery,
  invoicesQuery,
  quotationsQuery,
  updateQuotation,
  type QuotationStatus,
} from "@/features/workspace/workspace-api";
import { ApiError } from "@/lib/api";
import { formatDate, formatLkr } from "@/lib/format";

export const Route = createFileRoute("/dashboard/quotations/")({
  head: () => ({
    meta: [
      { title: "Quotations - ShootPlanner.lk" },
      { name: "description", content: "Create, send, and manage studio quotations." },
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
  const [status, setStatus] = useState<QuotationStatus | "All">("All");
  const clientById = useMemo(
    () => new Map((clients.data ?? []).map((client) => [client.id, client])),
    [clients.data],
  );
  const eventById = useMemo(
    () => new Map((events.data ?? []).map((event) => [event.id, event])),
    [events.data],
  );
  const invoicedIds = useMemo(
    () => new Set((invoices.data ?? []).map((invoice) => invoice.quotation_id)),
    [invoices.data],
  );
  const rows = (quotations.data ?? []).map((quotation) => {
    const event = eventById.get(quotation.event_id);
    return {
      quotation,
      event,
      client: event ? clientById.get(event.client_id) : undefined,
    };
  });
  const filtered = rows.filter((row) => {
    const matchesStatus = status === "All" || row.quotation.status === status;
    const needle = search.toLowerCase();
    return (
      matchesStatus &&
      `${clientDisplayName(row.client)} ${row.quotation.package_name ?? ""} ${row.event?.location ?? ""}`
        .toLowerCase()
        .includes(needle)
    );
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["workspace"] });
  const changeStatus = useMutation({
    mutationFn: (input: { id: string; status: QuotationStatus }) =>
      updateQuotation(input.id, input.status),
    onSuccess: refresh,
    onError: showError,
  });
  const convert = useMutation({
    mutationFn: convertQuotationToInvoice,
    onSuccess: async () => {
      await refresh();
      toast.success("Invoice created from quotation");
    },
    onError: showError,
  });
  const pending =
    clients.isPending || events.isPending || quotations.isPending || invoices.isPending;
  const failed = clients.isError || events.isError || quotations.isError || invoices.isError;

  return (
    <>
      <PageIntro
        title="Quotations"
        description="Create proposals, update their status, and convert accepted work into invoices."
        action={
          <Button asChild>
            <Link to="/dashboard/quotations/new">
              <Plus /> New quotation
            </Link>
          </Button>
        }
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_170px_auto]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search quotations"
            className="pl-9"
          />
        </label>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as QuotationStatus | "All")}
          className={selectClass}
        >
          <option>All</option>
          <option>Draft</option>
          <option>Sent</option>
          <option>Accepted</option>
        </select>
        <Button
          variant="outline"
          onClick={() =>
            downloadQuotations(
              filtered.map((row) => [
                clientDisplayName(row.client),
                row.quotation.package_name ?? "",
                row.quotation.status,
                row.event?.event_date ?? "",
                String(row.quotation.total),
              ]),
            )
          }
          disabled={filtered.length === 0}
        >
          <Download /> Download quotations
        </Button>
      </div>
      {pending && <State>Loading quotations...</State>}
      {failed && <State error>Unable to load quotations.</State>}
      {!pending && !failed && filtered.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <FileText className="mx-auto size-7 text-muted-foreground" />
          <p className="mt-3 text-sm font-bold">No matching quotations</p>
        </div>
      )}
      <div className="grid gap-3">
        {filtered.map(({ quotation, event, client }) => {
          const invoiced = invoicedIds.has(quotation.id);
          return (
            <article
              key={quotation.id}
              className="grid gap-4 rounded-lg border border-border bg-card p-5 md:grid-cols-[minmax(0,1.4fr)_1fr_1fr_150px_auto] md:items-center"
            >
              <div className="min-w-0">
                <p className="truncate font-extrabold">{clientDisplayName(client)}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {quotation.package_name ?? event?.event_type ?? "Custom quotation"}
                  {event ? ` - ${event.location}` : ""}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Event date</p>
                <p className="mt-1 text-sm font-semibold">
                  {event ? formatDate(event.event_date) : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="mt-1 text-sm font-extrabold">{formatLkr(quotation.total)}</p>
              </div>
              <select
                value={quotation.status}
                onChange={(event) =>
                  changeStatus.mutate({
                    id: quotation.id,
                    status: event.target.value as QuotationStatus,
                  })
                }
                disabled={changeStatus.isPending}
                className={selectClass}
              >
                <option>Draft</option>
                <option>Sent</option>
                <option>Accepted</option>
              </select>
              <Button
                variant={invoiced ? "outline" : "default"}
                disabled={invoiced || convert.isPending}
                onClick={() => convert.mutate(quotation.id)}
              >
                <ReceiptText />
                {invoiced ? "Invoiced" : "Create invoice"}
              </Button>
            </article>
          );
        })}
      </div>
    </>
  );
}

function State({ children, error = false }: { children: string; error?: boolean }) {
  return (
    <p
      className={`py-10 text-center text-sm ${error ? "font-semibold text-destructive" : "text-muted-foreground"}`}
    >
      {children}
    </p>
  );
}

function showError(error: Error) {
  toast.error(error instanceof ApiError ? error.message : "Unable to update quotation");
}

function downloadQuotations(rows: string[][]) {
  const values = [["Client", "Package", "Status", "Event date", "Total"], ...rows];
  const csv = values
    .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "quotations.csv";
  link.click();
  URL.revokeObjectURL(url);
}

const selectClass =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring";
