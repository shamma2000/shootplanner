import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/features/auth/auth-guard";

export const Route = createFileRoute("/dashboard")({ component: DashboardLayout });
function DashboardLayout() {
  return (
    <AuthGuard>
      <AppShell title="Studio workspace">
        <Outlet />
      </AppShell>
    </AuthGuard>
  );
}
