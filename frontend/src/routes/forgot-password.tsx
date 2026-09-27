import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AuthCard, Field, inputCls } from "@/components/layout/auth-ui";

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
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setSent(true);
    toast.success("Reset link sent! Check your inbox.");
  };
  return (
    <AuthCard title="Forgot password">
      <form onSubmit={submit} className="space-y-5">
        <p className="text-sm leading-6 text-muted-foreground">
          {sent
            ? `We've sent a reset link to ${email}. Check your inbox.`
            : "No problem. Enter your email address and we will send you a link to choose a new password."}
        </p>
        <Field label="Email address">
          <input
            className={inputCls}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </Field>
        <Button type="submit" size="lg" className="w-full">
          Email password reset link
        </Button>
        <p className="text-center">
          <Link to="/login" className="text-sm font-semibold text-primary-strong">
            Back to login
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
