import { Link, createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/layout/auth-ui";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot password — ShootPlanner.lk" },
      { name: "description", content: "Reset your ShootPlanner.lk password." },
      { property: "og:title", content: "Forgot password — ShootPlanner.lk" },
      { property: "og:description", content: "Get a password reset link by email." },
    ],
  }),
  component: ForgotPage,
});

function ForgotPage() {
  return (
    <AuthCard title="Forgot password">
      <div className="space-y-5">
        <p className="text-sm leading-6 text-muted-foreground">
          Automated password reset is not available yet. Contact your workspace administrator to
          restore access.
        </p>
        <Button asChild size="lg" className="w-full">
          <Link to="/login">Back to login</Link>
        </Button>
      </div>
    </AuthCard>
  );
}
