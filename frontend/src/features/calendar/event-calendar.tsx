import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, MapPin, Phone, Plus, RefreshCw, Search } from "lucide-react";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import {
  clientDisplayName,
  clientsQuery,
  createEvent,
  createEventWithClient,
  eventsQuery,
  invoicesQuery,
  quotationsQuery,
  type ClientRecord,
  type EventPayload,
  type EventRecord,
} from "@/features/workspace/workspace-api";
import { formatDate } from "@/lib/format";

const eventColors: Record<EventRecord["event_type"], string> = {
  Wedding: "#3b82f6",
  "Pre-shoot": "#db2777",
  Homecoming: "#059669",
  Engagement: "#d97706",
  Other: "#b45309",
  "Custom Event": "#0d9488",
};
const views = [
  { id: "dayGridMonth", label: "Month" },
  { id: "dayGridWeek", label: "Week" },
  { id: "listMonth", label: "List" },
] as const;

function dateKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export function EventCalendar() {
  const clients = useQuery(clientsQuery);
  const events = useQuery(eventsQuery);
  const quotations = useQuery(quotationsQuery);
  const invoices = useQuery(invoicesQuery);
  const calendar = useRef<FullCalendar>(null);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string | null>(null);
  const [status, setStatus] = useState("All");
  const [view, setView] = useState("dayGridMonth");
  const [title, setTitle] = useState("");
  const [newDate, setNewDate] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const clientById = useMemo(
    () => new Map((clients.data ?? []).map((client) => [client.id, client])),
    [clients.data],
  );
  const visibleEvents = useMemo(
    () =>
      (events.data ?? []).filter((event) => {
        const client = clientById.get(event.client_id);
        const text = [
          clientDisplayName(client),
          client?.primary_phone,
          client?.optional_phone,
          event.location,
        ]
          .join(" ")
          .toLowerCase();
        return (
          text.includes(search.trim().toLowerCase()) &&
          (!type || event.event_type === type) &&
          (status === "All" || event.status === status) &&
          (event.status !== "Postponed" || event.tentative_date)
        );
      }),
    [events.data, clientById, search, type, status],
  );
  const calendarEvents = useMemo(
    () =>
      visibleEvents.map((event) => ({
        id: event.id,
        title: clientDisplayName(clientById.get(event.client_id)),
        start: event.status === "Postponed" ? event.tentative_date! : event.event_date,
        allDay: true,
        backgroundColor: eventColors[event.event_type],
        borderColor: eventColors[event.event_type],
        textColor: event.status === "Draft" ? "#1f2937" : "#ffffff",
        classNames: [`event-status-${event.status.toLowerCase()}`],
        extendedProps: { type: event.event_type, status: event.status },
      })),
    [visibleEvents, clientById],
  );
  const selected = events.data?.find((event) => event.id === selectedId);
  const selectedClient = selected ? clientById.get(selected.client_id) : undefined;
  const quotation = quotations.data?.find((item) => item.event_id === selectedId);
  const invoice = invoices.data?.find((item) => item.quotation_id === quotation?.id);
  const pending = events.isPending || clients.isPending;
  const failed = events.isError || clients.isError;

  return (
    <section className="event-calendar" aria-label="Event overview">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Event Overview</h2>
        <Button
          className="bg-teal-600 text-white hover:bg-teal-700"
          disabled={pending || failed}
          onClick={() => setNewDate(dateKey(new Date()))}
        >
          <Plus /> Add Event
        </Button>
      </div>
      <div className="calendar-filter-bar">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            aria-label="Search events"
            placeholder="Search by name or phone..."
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <select
          className="workspace-select w-auto"
          aria-label="Event status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="All">All statuses</option>
          <option>Draft</option>
          <option>Confirmed</option>
          <option>Postponed</option>
        </select>
      </div>
      <div className="calendar-legend" aria-label="Event types">
        {Object.entries(eventColors).map(([name, color]) => (
          <button
            key={name}
            type="button"
            aria-pressed={type === name}
            title={`Filter ${name} events`}
            onClick={() => setType(type === name ? null : name)}
            className={type && type !== name ? "opacity-40" : ""}
          >
            <span style={{ backgroundColor: color }} />
            {name}
          </button>
        ))}
        <span className="calendar-status-key">
          <i className="status-draft" />
          Draft
        </span>
        <span className="calendar-status-key">
          <i className="status-confirmed" />
          Confirmed
        </span>
      </div>
      {failed ? (
        <div role="alert" className="py-10 text-center">
          <p className="text-sm text-destructive">Unable to load events.</p>
          <Button
            className="mt-3"
            variant="outline"
            onClick={() => {
              void events.refetch();
              void clients.refetch();
            }}
          >
            <RefreshCw /> Retry
          </Button>
        </div>
      ) : (
        <>
          <div className="calendar-toolbar">
            <div className="flex items-center gap-2">
              <div className="calendar-navigation">
                <button
                  aria-label="Previous period"
                  title="Previous period"
                  onClick={() => calendar.current?.getApi().prev()}
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  aria-label="Next period"
                  title="Next period"
                  onClick={() => calendar.current?.getApi().next()}
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => calendar.current?.getApi().today()}
              >
                Today
              </Button>
            </div>
            <h3 aria-live="polite" className="calendar-title">
              {title}
            </h3>
            <div className="calendar-modes" role="group" aria-label="Calendar view">
              {views.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={view === item.id}
                  onClick={() => calendar.current?.getApi().changeView(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          {pending && (
            <p className="mb-3 text-sm text-muted-foreground" role="status">
              Loading events...
            </p>
          )}
          <FullCalendar
            ref={calendar}
            plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            firstDay={1}
            headerToolbar={false}
            height="auto"
            views={{
              dayGridMonth: { fixedWeekCount: true },
              dayGridWeek: { fixedWeekCount: false },
            }}
            dayMaxEvents={2}
            displayEventTime={false}
            eventDisplay="block"
            events={calendarEvents}
            datesSet={(info) => {
              setTitle(info.view.title);
              setView(info.view.type);
            }}
            dateClick={(info) => {
              if (!pending && !failed) setNewDate(info.dateStr);
            }}
            eventClick={(info) => setSelectedId(info.event.id)}
            eventDidMount={(info) => {
              info.el.title = `${info.event.title} - ${info.event.extendedProps["type"]} - ${info.event.extendedProps["status"]}`;
            }}
            noEventsContent="No events in this period."
            dayHeaderFormat={{ weekday: "short" }}
          />
        </>
      )}
      <Sheet
        open={newDate !== null}
        onOpenChange={(open) => {
          if (!open) setNewDate(null);
        }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetTitle>Add Event</SheetTitle>
          <SheetDescription className="sr-only">
            Schedule an event for an existing or new client.
          </SheetDescription>
          {newDate && (
            <EventForm
              key={newDate}
              date={newDate}
              clients={clients.data ?? []}
              clientsUnavailable={pending || failed}
              onSaved={(date) => {
                setNewDate(null);
                calendar.current?.getApi().gotoDate(date);
              }}
            />
          )}
        </SheetContent>
      </Sheet>
      <Sheet
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetTitle>{selected?.event_type}</SheetTitle>
          <SheetDescription>{clientDisplayName(selectedClient)}</SheetDescription>
          {selected && (
            <div className="mt-6 space-y-5">
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Event date</dt>
                  <dd className="mt-1 font-semibold">{formatDate(selected.event_date)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="mt-1 font-semibold">{selected.status}</dd>
                </div>
                {selected.tentative_date && (
                  <div>
                    <dt className="text-muted-foreground">Tentative date</dt>
                    <dd className="mt-1 font-semibold">{formatDate(selected.tentative_date)}</dd>
                  </div>
                )}
              </dl>
              <p className="flex items-start gap-2 text-sm">
                <MapPin className="size-4 shrink-0" />
                {[selected.location, selected.hotel].filter(Boolean).join(", ")}
              </p>
              {selectedClient?.primary_phone && (
                <Button variant="outline" asChild>
                  <a href={`tel:${selectedClient.primary_phone}`}>
                    <Phone />
                    {selectedClient.primary_phone}
                  </a>
                </Button>
              )}
              {selected.postpone_reason && (
                <p className="text-sm text-muted-foreground">{selected.postpone_reason}</p>
              )}
              <div className="flex flex-wrap gap-2 border-t pt-5">
                {quotation && (
                  <Button asChild variant="outline">
                    <Link to="/dashboard/quotations">View quotation</Link>
                  </Button>
                )}
                {invoice && (
                  <Button asChild variant="outline">
                    <Link to="/dashboard/invoices">{invoice.invoice_number}</Link>
                  </Button>
                )}
                <Button asChild variant="outline">
                  <Link to="/dashboard/postponed">Manage postponement</Link>
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </section>
  );
}

function EventForm({
  date,
  clients,
  clientsUnavailable,
  onSaved,
}: {
  date: string;
  clients: ClientRecord[];
  clientsUnavailable: boolean;
  onSaved: (date: string) => void;
}) {
  const queryClient = useQueryClient();
  const [newClient, setNewClient] = useState(clients.length === 0);
  const save = useMutation({
    mutationFn: async (form: FormData) => {
      const payload: Omit<EventPayload, "client_id"> = {
        event_type: String(form.get("event_type")) as EventRecord["event_type"],
        event_date: String(form.get("event_date")),
        location: String(form.get("location")).trim(),
        hotel: String(form.get("hotel") ?? "").trim() || null,
        status: String(form.get("status")) as EventRecord["status"],
      };
      if (newClient) {
        return createEventWithClient({
          ...payload,
          client: {
            bride_name: String(form.get("bride_name")).trim(),
            groom_name: String(form.get("groom_name")).trim(),
            primary_phone: String(form.get("primary_phone")).trim(),
            email: null,
            optional_phone: null,
            address: null,
          },
        });
      }
      return createEvent({ ...payload, client_id: String(form.get("client_id")) });
    },
    onSuccess: async (event) => {
      await queryClient.invalidateQueries({ queryKey: ["workspace"] });
      toast.success("Event saved");
      onSaved(event.event_date);
    },
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    save.mutate(new FormData(event.currentTarget));
  };
  return (
    <form className="mt-6 space-y-4" onSubmit={submit}>
      <div className="flex gap-4" role="group" aria-label="Client selection">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="client_mode"
            checked={!newClient}
            onChange={() => setNewClient(false)}
          />
          Existing client
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="client_mode"
            checked={newClient}
            onChange={() => setNewClient(true)}
          />
          New client
        </label>
      </div>
      {newClient ? (
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-2 text-sm">
            First client name
            <Input name="bride_name" required maxLength={120} />
          </label>
          <label className="grid gap-2 text-sm">
            Second client name
            <Input name="groom_name" required maxLength={120} />
          </label>
          <label className="col-span-2 grid gap-2 text-sm">
            Phone
            <Input name="primary_phone" type="tel" required minLength={7} maxLength={30} />
          </label>
        </div>
      ) : (
        <label className="grid gap-2 text-sm">
          Client
          <select
            name="client_id"
            aria-label="Client"
            className="workspace-select"
            required
            defaultValue=""
            disabled={clientsUnavailable}
          >
            <option value="">{clients.length ? "Select a client" : "No clients yet"}</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {clientDisplayName(client)}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-2 text-sm">
          Event type
          <select className="workspace-select" name="event_type" defaultValue="Custom Event">
            {Object.keys(eventColors).map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          Date
          <Input name="event_date" type="date" required defaultValue={date} />
        </label>
      </div>
      <label className="grid gap-2 text-sm">
        Location
        <Input name="location" required maxLength={255} />
      </label>
      <label className="grid gap-2 text-sm">
        Hotel / venue
        <Input name="hotel" maxLength={255} />
      </label>
      <label className="grid gap-2 text-sm">
        Status
        <select name="status" className="workspace-select" defaultValue="Confirmed">
          <option>Draft</option>
          <option>Confirmed</option>
        </select>
      </label>
      {save.isError && (
        <p role="alert" className="text-sm text-destructive">
          {save.error.message || "Unable to save event. Please try again."}
        </p>
      )}
      <Button
        type="submit"
        disabled={save.isPending || (!newClient && clientsUnavailable)}
        className="w-full"
      >
        <Plus />
        {save.isPending ? "Saving..." : "Save event"}
      </Button>
    </form>
  );
}
