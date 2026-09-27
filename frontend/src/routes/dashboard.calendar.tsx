import { createFileRoute } from "@tanstack/react-router";
import { CalendarPage } from "@/features/calendar/calendar-page";

export const Route = createFileRoute("/dashboard/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar - ShootPlanner.lk" },
      { name: "description", content: "See studio events, schedules, and postponed shoots." },
      { property: "og:title", content: "Studio Calendar - ShootPlanner.lk" },
      { property: "og:description", content: "Every studio event and changed date at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CalendarPage,
});
