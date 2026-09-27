import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageIntro } from "@/components/layout/app-shell";
import { formatLkr, quotations } from "@/data/mock";
export const Route = createFileRoute("/dashboard/quotations/")({
  head: () => ({
    meta: [
      { title: "Quotations — ShootPlanner.lk" },
      { name: "description", content: "Create, send, and manage studio quotations." },
      { property: "og:title", content: "Quotations — ShootPlanner.lk" },
      { property: "og:description", content: "Professional studio quotations in one place." },
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
        title="Quotations"
        description="Build polished packages and turn accepted work into invoices."
        action={
          <Button asChild>
            <Link to="/dashboard/quotations/new">
              <Plus />
              New quotation
            </Link>
          </Button>
        }
      />
      <div className="grid gap-4">
        {quotations.map((q) => (
          <article
            key={q.id}
            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-soft"
          >
            <div className="grid size-11 place-items-center rounded-lg bg-primary-soft text-primary-strong">
              <FileText />
            </div>
            <div className="min-w-0">
              <p className="truncate font-extrabold">{q.id}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {q.packages[0]?.name} · {formatLkr(q.total)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground sm:block">
                {q.status}
              </span>
              {q.status === "Accepted" && (
                <Button size="sm" className="hidden sm:flex">
                  Convert to invoice
                </Button>
              )}
              <ArrowRight className="size-4 text-muted-foreground" />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
