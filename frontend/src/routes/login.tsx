import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { AuthCard, Field, PasswordInput, inputCls } from "@/components/layout/auth-ui";
import { currentUserQuery, login } from "@/features/auth/auth-api";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — ShootPlanner.lk" },
      { name: "description", content: "Sign in to your ShootPlanner.lk studio workspace." },
      { property: "og:title", content: "Sign in — ShootPlanner.lk" },
      {
        property: "og:description",
        content: "Access your studio quotations, invoices and calendar.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const user = await login(email, password, rememberMe);
      queryClient.setQueryData(currentUserQuery.queryKey, user);
      toast.success("Welcome back!");
      await navigate({ to: "/dashboard" });
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Unable to sign in");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <AuthCard title="Welcome back">
      <form onSubmit={submit} className="space-y-5">
        <Field label="Email address">
          <input
            className={inputCls}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </Field>
        <Field label="Password">
          <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-muted-foreground">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="font-semibold text-primary-strong">
            Forgot password?
          </Link>
        </div>
        {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Log in"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          New to ShootPlanner?{" "}
          <Link to="/signup" className="font-semibold text-primary-strong">
            Start free
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
