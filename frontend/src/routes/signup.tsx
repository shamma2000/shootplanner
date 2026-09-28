import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Field, PasswordInput, inputCls } from "@/components/layout/auth-ui";
import { currentUserQuery, register } from "@/features/auth/auth-api";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Start free — Create your studio | ShootPlanner.lk" },
      {
        name: "description",
        content:
          "Create your free ShootPlanner.lk studio workspace in minutes. 7-day free trial, no card required.",
      },
      { property: "og:title", content: "Create your studio workspace — ShootPlanner.lk" },
      {
        property: "og:description",
        content: "Quotations, invoices, deliverables and calendar in your own branded workspace.",
      },
    ],
  }),
  component: SignupPage,
});

const schema = z
  .object({
    studio: z.string().trim().min(2, "Studio name is required").max(80),
    subdomain: z
      .string()
      .trim()
      .regex(/^[a-z0-9-]{3,30}$/, "Use 3–30 lowercase letters, numbers or dashes"),
    name: z.string().trim().min(2, "Your name is required").max(80),
    email: z.string().trim().email("Enter a valid email address").max(255),
    phone: z
      .string()
      .trim()
      .regex(/^0\d{9}$/, "Enter a valid mobile number, e.g. 0771234567"),
    password: z.string().min(8, "Minimum 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });
type Form = z.input<typeof schema>;
const perks = [
  "7-day free trial — no card required",
  "Your own subdomain workspace",
  "Branded quotations & invoices",
  "Cancel anytime",
];

function SignupPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Form>({
    studio: "",
    subdomain: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({
      ...f,
      [k]:
        k === "subdomain"
          ? e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
          : e.target.value,
    }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) {
      const errs: typeof errors = {};
      r.error.issues.forEach((i) => {
        errs[i.path[0] as keyof Form] ??= i.message;
      });
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitError("");
    setIsSubmitting(true);
    try {
      const user = await register({
        studio_name: r.data.studio,
        subdomain: r.data.subdomain,
        name: r.data.name,
        email: r.data.email,
        phone: r.data.phone,
        password: r.data.password,
      });
      queryClient.removeQueries({ queryKey: ["workspace"] });
      queryClient.setQueryData(currentUserQuery.queryKey, user);
      toast.success("Your studio workspace is ready!");
      await navigate({ to: "/dashboard" });
    } catch (requestError) {
      setSubmitError(
        requestError instanceof ApiError ? requestError.message : "Unable to create workspace",
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/" className="text-lg font-extrabold">
            ShootPlanner<span className="text-primary-strong">.lk</span>
          </Link>
          <Button variant="ghost" asChild>
            <Link to="/login">Log in</Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl gap-10 px-5 py-10 lg:grid-cols-2 lg:py-16">
        <section className="lg:pt-8">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
            Start your studio <span className="text-primary-strong">workspace</span>
          </h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            Create quotations, convert them to invoices, track deliverables and manage your calendar
            — all in your own branded workspace.
          </p>
          <ul className="mt-8 space-y-4">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-3 text-sm font-medium">
                <span className="grid size-7 place-items-center rounded-full bg-primary-soft text-primary-strong">
                  <Check className="size-4" />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </section>
        <form
          onSubmit={submit}
          className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8"
        >
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Create your free workspace</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-primary-strong">
                Log in
              </Link>
            </p>
          </div>
          <Field label="Studio / business name" error={errors.studio}>
            <input
              className={inputCls}
              placeholder="e.g. Golden Moments Studio"
              value={form.studio}
              onChange={set("studio")}
            />
          </Field>
          <Field label="Workspace subdomain" error={errors.subdomain}>
            <div className="flex overflow-hidden rounded-xl border border-border focus-within:ring-2 focus-within:ring-primary/40">
              <input
                className="h-12 min-w-0 flex-1 bg-background px-4 text-sm outline-none"
                placeholder="your-studio"
                value={form.subdomain}
                onChange={set("subdomain")}
              />
              <span className="grid place-items-center bg-muted px-4 text-sm text-muted-foreground">
                .shootplanner.lk
              </span>
            </div>
          </Field>
          <Field label="Your full name" error={errors.name}>
            <input
              className={inputCls}
              placeholder="Jane Perera"
              value={form.name}
              onChange={set("name")}
            />
          </Field>
          <Field
            label="Email"
            hint="Use an active email — you'll need it to reset your password."
            error={errors.email}
          >
            <input
              className={inputCls}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set("email")}
            />
          </Field>
          <Field label="Mobile number" error={errors.phone}>
            <input
              className={inputCls}
              type="tel"
              placeholder="e.g. 0771234567"
              value={form.phone}
              onChange={set("phone")}
            />
          </Field>
          <Field label="Password" error={errors.password}>
            <PasswordInput
              placeholder="Min 8 characters"
              value={form.password}
              onChange={set("password")}
            />
          </Field>
          <Field label="Confirm password" error={errors.confirm}>
            <PasswordInput value={form.confirm} onChange={set("confirm")} />
          </Field>
          {submitError && <p className="text-sm font-semibold text-destructive">{submitError}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating workspace..." : "Create workspace"}
          </Button>
        </form>
      </main>
    </div>
  );
}
