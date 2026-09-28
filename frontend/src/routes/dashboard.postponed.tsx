import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, RotateCcw } from "lucide-react";
import { useMemo, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { PageIntro } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  clientDisplayName,
  clientsQuery,
  eventsQuery,
  updateEvent,
} from "@/features/workspace/workspace-api";
import { ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/dashboard/postponed")({
  head: () => ({ meta: [{ title: "Postponed events - ShootPlanner.lk" }] }),
  component: Page,
});

function Page() {
  const clients = useQuery(clientsQuery);
  const events = useQuery(eventsQuery);
  const queryClient = useQueryClient();
  const clientById = useMemo(
    () => new Map((clients.data ?? []).map((client) => [client.id, client])),
    [clients.data],
  );
  const available = (events.data ?? []).filter((event) => event.status !== "Postponed");
  const postponed = (events.data ?? []).filter((event) => event.status === "Postponed");
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["workspace", "events"] });
  const postpone = useMutation({
    mutationFn: (input: { id: string; date: string | null; reason: string | null }) =>
      updateEvent(input.id, {
        status: "Postponed",
        tentative_date: input.date,
        postpone_reason: input.reason,
      }),
    onSuccess: async () => {
      await refresh();
      toast.success("Event moved to postponed");
    },
    onError: showError,
  });
  const restore = useMutation({
    mutationFn: (id: string) => updateEvent(id, { status: "Confirmed" }),
    onSuccess: async () => {
      await refresh();
      toast.success("Event restored to the calendar");
    },
    onError: showError,
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const id = String(data.get("event_id") ?? "");
    if (!id) {
      toast.error("Choose an event");
      return;
    }
    postpone.mutate(
      {
        id,
        date: String(data.get("tentative_date") ?? "") || null,
        reason: String(data.get("reason") ?? "").trim() || null,
      },
      { onSuccess: () => form.reset() },
    );
  };

  return (
    <>
      <PageIntro
        title="Postponed"
        description="Keep original event dates, tentative replacements, and reasons together."
      />
      <form onSubmit={submit} className="mb-6 rounded-lg border border-border bg-card p-5">
        <h2 className="font-extrabold">Postpone an event</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-[1.4fr_1fr_1.4fr_auto] md:items-end">
          <Field label="Event">
            <select name="event_id" className={selectClass} defaultValue="" required>
              <option value="" disabled>
                Choose an event
              </option>
              {available.map((item) => (
                <option key={item.id} value={item.id}>
                  {clientDisplayName(clientById.get(item.client_id))} - {item.event_type} -{" "}
                  {formatDate(item.event_date)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tentative date">
            <Input name="tentative_date" type="date" />
          </Field>
          <Field label="Reason">
            <Input name="reason" placeholder="Optional" />
          </Field>
          <Button type="submit" disabled={postpone.isPending || available.length === 0}>
            <CalendarClock /> Postpone
          </Button>
        </div>
      </form>
      {(events.isPending || clients.isPending) && <State>Loading events...</State>}
      {(events.isError || clients.isError) && <State error>Unable to load events.</State>}
      {!events.isPending && !clients.isPending && postponed.length === 0 && (
        <div className="rounded-lg border border-dashed border-border px-5 py-12 text-center">
          <CalendarClock className="mx-auto size-7 text-muted-foreground" />
          <p className="mt-3 text-sm font-bold">No postponed events</p>
        </div>
      )}
      <div className="grid gap-4">
        {postponed.map((item) => (
          <article
            key={item.id}
            className="grid gap-4 rounded-lg border border-border bg-card p-5 md:grid-cols-[1.4fr_1fr_1fr_1.5fr_auto] md:items-center"
          >
            <div>
              <p className="font-extrabold">{clientDisplayName(clientById.get(item.client_id))}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.event_type} - {item.location}
              </p>
            </div>
            <DateValue label="Original date" value={item.original_date ?? item.event_date} />
            <DateValue label="Tentative date" value={item.tentative_date} />
            <div>
              <p className="text-xs font-bold text-muted-foreground">Reason</p>
              <p className="mt-1 text-sm">{item.postpone_reason ?? "Not specified"}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => restore.mutate(item.id)}
              disabled={restore.isPending}
            >
              <RotateCcw /> Restore
            </Button>
          </article>
        ))}
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold">{label}</span>
      {children}
    </label>
  );
}

function DateValue({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-bold text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value ? formatDate(value) : "Not set"}</p>
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

function showError(error: Error) {
  toast.error(error instanceof ApiError ? error.message : "Unable to update event");
}

const selectClass =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring";
