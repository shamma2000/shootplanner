import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Download, FileText, Plus, ReceiptText, Save } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { RecordFilters } from "@/features/workspace/record-filters";
import { emptyRecordFilter, matchesRecordFilter } from "@/features/workspace/record-filter";
import {
  clientDisplayName,
  clientsQuery,
  convertQuotationToInvoice,
  eventsQuery,
  invoicesQuery,
  quotationsQuery,
  updateInvoice,
  type InvoiceRecord,
  type InvoiceStatus,
} from "@/features/workspace/workspace-api";
import { ApiError } from "@/lib/api";
import { formatDate, formatLkr } from "@/lib/format";

export function InvoicesPage() {
  const clients = useQuery(clientsQuery);
  const events = useQuery(eventsQuery);
  const quotations = useQuery(quotationsQuery);
  const invoices = useQuery(invoicesQuery);
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState(emptyRecordFilter);
  const [showCreate, setShowCreate] = useState(false);
  const [status, setStatus] = useState<InvoiceStatus | "All">("All");
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
  const rows = (invoices.data ?? []).map((invoice) => {
    const quotation = quotationById.get(invoice.quotation_id);
    const event = quotation ? eventById.get(quotation.event_id) : undefined;
    return {
      invoice,
      event,
      client: event ? clientById.get(event.client_id) : undefined,
    };
  });
  const filtered = rows.filter((row) => {
    const matchesStatus = status === "All" || row.invoice.status === status;
    return (
      matchesStatus &&
      matchesRecordFilter(
        filter,
        [
          row.invoice.invoice_number,
          clientDisplayName(row.client),
          row.client?.primary_phone,
          row.client?.optional_phone,
        ].join(" "),
        row.event?.event_date ?? row.invoice.created_at,
      )
    );
  });
  const save = useMutation({
    mutationFn: (input: {
      id: string;
      advance_paid: number;
      due_date: string;
      status: InvoiceStatus;
    }) => updateInvoice(input.id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["workspace", "invoices"] });
      toast.success("Invoice updated");
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Unable to update invoice"),
  });
  const pending =
    clients.isPending || events.isPending || quotations.isPending || invoices.isPending;
  const failed = clients.isError || events.isError || quotations.isError || invoices.isError;
  const availableQuotations = (quotations.data ?? []).filter(
    (quotation) => !(invoices.data ?? []).some((invoice) => invoice.quotation_id === quotation.id),
  );
  const convert = useMutation({
    mutationFn: convertQuotationToInvoice,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["workspace"] });
      setShowCreate(false);
      toast.success("Invoice created");
    },
  });

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">
          Invoices{" "}
          <span className="ml-2 text-base font-normal text-muted-foreground">
            ({invoices.data?.length ?? 0})
          </span>
        </h1>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setShowCreate(true)}>
            <Plus />
            New Invoice
          </Button>
          <Button
            className="bg-green-600 text-white hover:bg-green-700"
            onClick={() =>
              exportInvoices(filtered.map(({ invoice, client }) => ({ invoice, client })))
            }
            disabled={filtered.length === 0}
          >
            <Download /> Export CSV
          </Button>
        </div>
      </div>
      <section className="bg-card">
        <div className="invoice-filters">
          <RecordFilters
            label="Invoices"
            dates={rows.map((row) => row.event?.event_date ?? row.invoice.created_at)}
            onFilter={setFilter}
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as InvoiceStatus | "All")}
            className="workspace-select max-w-36"
            aria-label="Invoice status"
          >
            <option value="All">All statuses</option>
            <option>Pending</option>
            <option>Paid</option>
            <option>Overdue</option>
          </select>
        </div>
        {pending && <State>Loading invoices...</State>}
        {failed && <State error>Unable to load invoices.</State>}
        {!pending && !failed && filtered.length === 0 && (
          <div className="workspace-empty">
            <FileText className="mb-5 size-10 text-muted-foreground/40" strokeWidth={1.5} />
            <p>No invoices found.</p>
          </div>
        )}
        <div className="divide-y divide-border">
          {filtered.map(({ invoice, event, client }) => (
            <form
              key={invoice.id}
              onSubmit={(formEvent) => submitInvoice(formEvent, invoice.id, save.mutate)}
              className="p-5"
            >
              <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:items-center">
                <div>
                  <p className="font-extrabold">{clientDisplayName(client)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {invoice.invoice_number}
                    {event ? ` - ${event.event_type} on ${formatDate(event.event_date)}` : ""}
                  </p>
                </div>
                <Amount label="Invoice total" value={invoice.amount} />
                <Amount label="Advance paid" value={invoice.advance_paid} />
                <Amount label="Balance" value={invoice.balance_due} strong />
              </div>
              <div className="mt-5 grid gap-3 border-t border-border pt-4 sm:grid-cols-[1fr_1fr_170px_auto] sm:items-end">
                <Field label="Advance paid (LKR)">
                  <Input
                    name="advance_paid"
                    type="number"
                    min="0"
                    max={Number(invoice.amount)}
                    defaultValue={Number(invoice.advance_paid)}
                  />
                </Field>
                <Field label="Due date">
                  <Input name="due_date" type="date" defaultValue={invoice.due_date} required />
                </Field>
                <Field label="Status">
                  <select name="status" defaultValue={invoice.status} className={selectClass}>
                    <option>Pending</option>
                    <option>Paid</option>
                    <option>Overdue</option>
                  </select>
                </Field>
                <Button type="submit" variant="outline" disabled={save.isPending}>
                  <Save /> Save
                </Button>
              </div>
            </form>
          ))}
        </div>
      </section>
      <Sheet open={showCreate} onOpenChange={setShowCreate}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetTitle>New Invoice</SheetTitle>
          <SheetDescription>Choose a quotation to invoice.</SheetDescription>
          {pending ? (
            <p className="mt-6 text-sm">Loading quotations...</p>
          ) : failed ? (
            <p role="alert" className="mt-6 text-sm text-destructive">
              Unable to load quotations.
            </p>
          ) : availableQuotations.length === 0 ? (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-muted-foreground">No quotations available to invoice.</p>
              <Button asChild>
                <Link to="/dashboard/quotations/new">
                  <Plus />
                  New quotation
                </Link>
              </Button>
            </div>
          ) : (
            <form
              className="mt-6 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                convert.mutate(String(new FormData(event.currentTarget).get("quotation_id")));
              }}
            >
              <label className="grid gap-2 text-sm">
                Quotation
                <select
                  name="quotation_id"
                  aria-label="Quotation"
                  required
                  defaultValue=""
                  className="workspace-select"
                >
                  <option value="" disabled>
                    Select a quotation
                  </option>
                  {availableQuotations.map((quotation) => {
                    const event = eventById.get(quotation.event_id);
                    const client = event ? clientById.get(event.client_id) : undefined;
                    return (
                      <option key={quotation.id} value={quotation.id}>
                        {clientDisplayName(client)} - {formatLkr(quotation.total)}
                      </option>
                    );
                  })}
                </select>
              </label>
              {convert.isError && (
                <p role="alert" className="text-sm text-destructive">
                  {convert.error.message}
                </p>
              )}
              <Button type="submit" disabled={convert.isPending}>
                <ReceiptText />
                {convert.isPending ? "Creating..." : "Create invoice"}
              </Button>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function submitInvoice(
  event: FormEvent<HTMLFormElement>,
  id: string,
  mutate: (input: {
    id: string;
    advance_paid: number;
    due_date: string;
    status: InvoiceStatus;
  }) => void,
) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  mutate({
    id,
    advance_paid: Number(data.get("advance_paid")),
    due_date: String(data.get("due_date")),
    status: String(data.get("status")) as InvoiceStatus,
  });
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <span className="mb-2 block text-xs font-bold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Amount({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number | string;
  strong?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm ${strong ? "font-extrabold text-primary-strong" : "font-bold"}`}>
        {formatLkr(value)}
      </p>
    </div>
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

function exportInvoices(
  rows: Array<{ invoice: InvoiceRecord; client: Parameters<typeof clientDisplayName>[0] }>,
) {
  const values = [
    ["Invoice", "Client", "Amount", "Advance paid", "Balance", "Due date", "Status"],
    ...rows.map(({ invoice, client }) => [
      invoice.invoice_number,
      clientDisplayName(client),
      String(invoice.amount),
      String(invoice.advance_paid),
      String(invoice.balance_due),
      invoice.due_date,
      invoice.status,
    ]),
  ];
  const csv = values
    .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "invoices.csv";
  link.click();
  URL.revokeObjectURL(url);
}

const selectClass =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring";
