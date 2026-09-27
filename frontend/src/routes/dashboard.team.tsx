import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageIntro } from "@/components/layout/app-shell";
export const Route = createFileRoute("/dashboard/team")({
  head: () => ({
    meta: [
      { title: "Team — ShootPlanner.lk" },
      { name: "description", content: "Manage your studio team in ShootPlanner." },
      { property: "og:title", content: "Team — ShootPlanner.lk" },
      { property: "og:description", content: "Your studio team, beautifully organized." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
function Page() {
  return (
    <>
      <PageIntro
        title="Team"
        description="Everything you need to manage your studio team in one place."
      />
      <div className="rounded-xl border border-dashed border-border bg-card px-5 py-16 text-center shadow-soft">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary-soft text-primary-strong">
          <Inbox />
        </div>
        <h2 className="mt-5 font-extrabold">Your team workspace is ready</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Add your first item to start building a clear, organized studio workflow.
        </p>
        <Button className="mt-6">
          Get started
          <ArrowRight />
        </Button>
      </div>
    </>
  );
}
