import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";

export const Route = createFileRoute("/dashboard")({ component: DashboardLayout });
function DashboardLayout() {
  return (
    <AppShell title="Studio workspace">
      <Outlet />
    </AppShell>
  );
}
