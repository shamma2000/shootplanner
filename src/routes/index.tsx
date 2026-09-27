import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  FileCheck2,
  FileText,
  Menu,
  MessageCircle,
  PackageCheck,
  PieChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ShootPlanner.lk — Studio management for photographers" },
      {
        name: "description",
        content:
          "Manage quotations, invoices, payments, schedules, and deliveries in one workspace built for Sri Lankan studios.",
      },
      { property: "og:title", content: "ShootPlanner.lk — Run your studio like a pro" },
      {
        property: "og:description",
        content:
          "The beautifully simple studio workspace for Sri Lankan photographers and videographers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});
const features = [
  {
    title: "Smart quotations",
    copy: "Build polished, branded quotes in minutes—not hours.",
    icon: FileText,
  },
  {
    title: "WhatsApp & PDF sharing",
    copy: "Share the perfect proposal wherever clients respond fastest.",
    icon: MessageCircle,
  },
  {
    title: "Automated invoicing",
    copy: "Turn accepted quotes into clear invoices with one tap.",
    icon: FileCheck2,
  },
  {
    title: "Interactive calendar",
    copy: "See every shoot, deadline, and team commitment at a glance.",
    icon: CalendarDays,
  },
  {
    title: "Postponed deliveries",
    copy: "Keep changed dates and client follow-ups from slipping away.",
    icon: PackageCheck,
  },
  {
    title: "Income & expense tracking",
    copy: "Know what comes in, what goes out, and what you truly earn.",
    icon: PieChart,
  },
];
function LandingPage() {
  return (
    <div className="bg-card text-foreground">
      <header className="absolute inset-x-0 top-0 z-20 mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-8">
        <Link to="/" className="text-xl font-extrabold">
          ShootPlanner<span className="text-primary-strong">.lk</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-semibold md:flex">
          <a href="#features">Features</a>
          <Button variant="ghost" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link to="/signup">Start free</Link>
          </Button>
        </nav>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu />
        </Button>
      </header>
      <main>
        <section className="star-field flex min-h-[760px] items-center border-b border-border px-5 pb-16 pt-28 md:min-h-[820px] md:px-8">
          <div className="mx-auto w-full max-w-6xl text-center">
            <div className="mx-auto inline-flex max-w-full items-center gap-2 rounded-full border border-primary/25 bg-primary-soft px-4 py-2 text-xs font-bold text-primary-strong">
              <span className="size-2 shrink-0 rounded-full bg-primary" />
              <span className="truncate">Trusted by studios across Sri Lanka</span>
            </div>
            <h1 className="mx-auto mt-8 max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
              Plan your shoots <span className="text-primary-strong">Smarter</span>
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
              Manage quotations and invoices, track payments, organize scheduling, and handle
              deliverables—beautifully organized in one branded workspace made for wedding
              photographers and videographers.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link to="/signup">
                  Create your studio
                  <ArrowRight />
                </Link>
              </Button>
            </div>
            <p className="mt-5 text-xs font-semibold text-muted-foreground">
              Plan smarter · Manage easier · Shoot better
            </p>
          </div>
        </section>
        <section id="features" className="bg-background px-6 py-30 md:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary-strong">
                Everything you need
              </p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight md:text-5xl">
                Powerful tools, beautifully simple
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                Focus on capturing the moment—let ShootPlanner handle the paperwork.
              </p>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {features.map(({ title, copy, icon: Icon }) => (
                <article
                  key={title}
                  className="rounded-xl border border-border bg-card p-6 shadow-soft"
                >
                  <div className="grid size-11 place-items-center rounded-full bg-primary-soft text-primary-strong">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-extrabold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-border bg-sidebar px-5 py-10 text-sidebar-muted">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 sm:flex-row">
          <p className="font-extrabold text-sidebar-foreground">
            ShootPlanner<span className="text-primary">.lk</span>
          </p>
          <p className="text-xs">Made for Sri Lankan creative studios.</p>
        </div>
      </footer>
    </div>
  );
}
