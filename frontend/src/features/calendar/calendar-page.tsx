import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventCalendar } from "@/features/calendar/event-calendar";

export function CalendarPage() {
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <Button variant="outline" asChild>
          <Link to="/dashboard/postponed">
            <Clock />
            Postponed events
          </Link>
        </Button>
      </div>
      <EventCalendar />
    </>
  );
}
