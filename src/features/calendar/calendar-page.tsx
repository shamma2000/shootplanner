import { ChevronRight, MapPin, Phone, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageIntro } from "@/components/layout/app-shell";
const legend = [
  ["Wedding", "bg-blue-500"],
  ["Pre-shoot", "bg-pink-500"],
  ["Homecoming", "bg-emerald-500"],
  ["Engagement", "bg-primary"],
  ["Other", "bg-amber-800"],
  ["Custom event", "bg-teal-500"],
  ["Draft", "bg-muted-foreground"],
  ["Confirmed", "bg-foreground"],
];
export function CalendarPage() {
  const [selected, setSelected] = useState<Date | undefined>(new Date(2026, 8, 25));
  const [view, setView] = useState("Month");
  return (
    <>
      <PageIntro
        title="Calendar"
        description="Keep every shoot, client promise, and changed date in view."
      />
      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="postponed">Postponed</TabsTrigger>
        </TabsList>
        <TabsContent value="events" className="mt-5">
          <div className="rounded-xl border border-border bg-card p-4 shadow-soft md:p-6">
            <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="inline-flex self-start rounded-lg bg-muted p-1">
                {["Month", "Week", "List"].map((item) => (
                  <button
                    key={item}
                    onClick={() => setView(item)}
                    className={`rounded-md px-4 py-2 text-xs font-bold ${view === item ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {legend.map(([item, color]) => (
                  <span
                    key={item}
                    className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"
                  >
                    <span className={`size-2 rounded-full ${color}`} />
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="min-w-0 overflow-x-auto rounded-lg border border-border">
                <Calendar
                  mode="single"
                  month={new Date(2026, 8, 1)}
                  selected={selected}
                  onSelect={setSelected}
                  className="pointer-events-auto w-full [--cell-size:clamp(2.5rem,7vw,5.5rem)]"
                  modifiers={{ booked: [new Date(2026, 8, 25), new Date(2026, 8, 28)] }}
                  modifiersClassNames={{
                    booked:
                      "after:absolute after:bottom-1 after:size-1 after:rounded-full after:bg-primary",
                  }}
                />
              </div>
              <aside className="rounded-lg bg-muted p-5">
                <p className="text-xs font-bold text-primary-strong">Selected day</p>
                <h2 className="mt-1 text-xl font-extrabold">
                  September {selected?.getDate() ?? 25}, 2026
                </h2>
                <div className="mt-5 rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary-strong">
                      Wedding
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">9:00 AM</span>
                  </div>
                  <p className="mt-4 font-extrabold">Dinithi & Kasun</p>
                  <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="size-3" />
                    Galle Face Hotel, Colombo
                  </p>
                  <Button className="mt-5 w-full" variant="outline">
                    View event
                    <ChevronRight />
                  </Button>
                </div>
              </aside>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="postponed" className="mt-5">
          <div className="space-y-4">
            {[
              ["Sachini & Malith", "Aug 12, 2026", "Oct 04, 2026"],
              ["Nethmi & Dilan", "Sep 05, 2026", "Date pending"],
            ].map(([name, oldDate, newDate]) => (
              <article
                key={name}
                className="rounded-xl border border-border bg-card p-5 shadow-soft"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="text-xs font-bold text-muted-foreground">Wedding</span>
                    <h3 className="mt-1 font-extrabold">{name}</h3>
                    <p className="mt-3 text-sm font-bold">
                      {oldDate} <span className="px-2 text-primary-strong">→</span> {newDate}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      variant="outline"
                      onClick={() => toast.success("Ready to update the new date")}
                    >
                      <RefreshCw />
                      Update new date
                    </Button>
                    <Button onClick={() => toast.success("Opening client contact")}>
                      <Phone />
                      Contact client
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
