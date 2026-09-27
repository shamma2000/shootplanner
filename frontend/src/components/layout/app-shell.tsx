import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  CalendarDays,
  CircleHelp,
  FileCheck2,
  FileText,
  HandCoins,
  Home,
  LogOut,
  Menu,
  PackageOpen,
  ReceiptText,
  Settings,
  TimerReset,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const primaryLinks = [
  { label: "Dashboard", to: "/dashboard", icon: Home },
  { label: "Quotations", to: "/dashboard/quotations", icon: FileText },
  { label: "Packages", to: "/dashboard/packages", icon: PackageOpen },
  { label: "Invoices", to: "/dashboard/invoices", icon: ReceiptText },
  { label: "Deliveries", to: "/dashboard/deliveries", icon: FileCheck2 },
  { label: "Postponed", to: "/dashboard/postponed", icon: TimerReset },
  { label: "Calendar", to: "/dashboard/calendar", icon: CalendarDays },
  { label: "Finance", to: "/dashboard/finance", icon: HandCoins },
] as const;
const secondaryLinks = [
  { label: "Settings", to: "/dashboard/settings", icon: Settings },
  { label: "Billing", to: "/dashboard/billing", icon: ReceiptText },
  { label: "Team", to: "/dashboard/team", icon: Users },
  { label: "Help", to: "/dashboard/help", icon: CircleHelp },
] as const;

function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <Link to="/" className="flex min-w-0 items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-base font-black text-primary-foreground">
        SP
      </span>
      <span
        className={`truncate text-lg font-extrabold ${dark ? "text-sidebar-foreground" : "text-foreground"}`}
      >
        ShootPlanner<span className="text-primary-strong">.lk</span>
      </span>
    </Link>
  );
}

function SidebarContent() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const links = (items: typeof primaryLinks | typeof secondaryLinks) =>
    items.map(({ label, to, icon: Icon }) => {
      const active = to === "/dashboard" ? pathname === to : pathname.startsWith(to);
      return (
        <Link
          key={to}
          to={to}
          className={`flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors ${active ? "bg-sidebar-accent text-primary" : "text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"}`}
        >
          <Icon className="size-4 shrink-0" />
          {label}
        </Link>
      );
    });
  return (
    <div className="flex h-full flex-col bg-sidebar p-4">
      <Brand dark />
      <nav className="mt-8 space-y-1">{links(primaryLinks)}</nav>
      <div className="my-5 h-px bg-sidebar-border" />
      <nav className="space-y-1">{links(secondaryLinks)}</nav>
      <div className="mt-auto border-t border-sidebar-border pt-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft font-bold text-primary">
            SN
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-sidebar-foreground">Shashika Neshan</p>
            <p className="truncate text-xs text-sidebar-muted">hello@romance.lk</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut />
          Log out
        </Button>
      </div>
    </div>
  );
}

export function AppShell({ children, title }: { children: ReactNode; title: string }) {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen lg:block">
          <SidebarContent />
        </aside>
        <div className="min-w-0">
          <header className="sticky top-0 z-30 grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur md:px-7">
            <div className="flex min-w-0 items-center gap-3">
              <div className="lg:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Open navigation">
                      <Menu />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[290px] border-none bg-sidebar p-0">
                    <SheetTitle className="sr-only">Navigation</SheetTitle>
                    <SidebarContent />
                  </SheetContent>
                </Sheet>
              </div>
              <div className="hidden lg:block">
                <p className="truncate text-sm font-bold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">Romance Studio</p>
              </div>
              <div className="lg:hidden">
                <Brand />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden rounded-full bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary-strong sm:inline">
                7 days left in trial
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Notifications"
                    className="relative"
                  >
                    <Bell />
                    <span className="absolute right-2 top-2 size-2 rounded-full bg-primary" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Notifications</TooltipContent>
              </Tooltip>
            </div>
          </header>
          <main className="mx-auto w-full max-w-[1480px] p-4 md:p-7">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}

export function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
