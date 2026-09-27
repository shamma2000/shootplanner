import { Link } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState, type InputHTMLAttributes, type ReactNode } from "react";

export function AuthLogo() {
  return (
    <Link
      to="/"
      className="mx-auto grid size-12 place-items-center rounded-xl border-2 border-dashed border-primary/60 text-lg font-extrabold"
    >
      S<span className="text-primary-strong">P</span>
    </Link>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold">{label}</span>
      {children}
      {hint && <span className="block text-xs leading-5 text-muted-foreground">{hint}</span>}
      {error && <span className="block text-xs font-semibold text-destructive">{error}</span>}
    </label>
  );
}

export const inputCls =
  "h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40";

export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={show ? "text" : "password"} className={inputCls + " pr-12"} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      >
        {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
      </button>
    </div>
  );
}

export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card p-7 shadow-soft sm:p-9">
          <AuthLogo />
          <h1 className="mt-5 text-center text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">ShootPlanner.lk</p>
          <div className="mt-7">{children}</div>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          ShootPlanner.lk · Made for Sri Lankan studios
        </p>
      </div>
    </div>
  );
}
