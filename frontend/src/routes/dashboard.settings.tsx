import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, Landmark, Palette, Save } from "lucide-react";
import { type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { PageIntro } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { studioQuery, updateStudio } from "@/features/workspace/workspace-api";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({
    meta: [
      { title: "Settings - ShootPlanner.lk" },
      { name: "description", content: "Manage studio branding and business details." },
    ],
  }),
  component: Page,
});

function Page() {
  const studio = useQuery(studioQuery);
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: updateStudio,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["workspace", "studio"] });
      toast.success("Studio settings saved");
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Unable to save settings"),
  });

  if (studio.isPending) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Loading settings...</p>;
  }
  if (studio.isError || !studio.data) {
    return (
      <p className="py-10 text-center text-sm font-semibold text-destructive">
        Unable to load settings.
      </p>
    );
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const optional = (name: string) => String(data.get(name) ?? "").trim() || null;
    save.mutate({
      name: String(data.get("name") ?? "").trim(),
      phone: optional("phone"),
      email: optional("email"),
      address: optional("address"),
      brand_color_primary: optional("brand_color_primary"),
      brand_color_secondary: optional("brand_color_secondary"),
      bank_name: optional("bank_name"),
      bank_account_holder: optional("bank_account_holder"),
      bank_account_number: optional("bank_account_number"),
      bank_branch: optional("bank_branch"),
    });
  };
  const value = studio.data;

  return (
    <>
      <PageIntro
        title="Settings & Branding"
        description="Control the studio details used throughout your workspace and documents."
      />
      <form key={value.updated_at} onSubmit={submit} className="mx-auto max-w-5xl space-y-5">
        <SettingsSection
          icon={<Palette />}
          title="Branding"
          description="Used in navigation and client-facing documents."
        >
          <Field label="Studio name" wide>
            <Input name="name" defaultValue={value.name} required />
          </Field>
          <Field label="Primary brand color">
            <ColorField
              name="brand_color_primary"
              defaultValue={value.brand_color_primary ?? "#f5a20b"}
            />
          </Field>
          <Field label="Secondary brand color">
            <ColorField
              name="brand_color_secondary"
              defaultValue={value.brand_color_secondary ?? "#18212f"}
            />
          </Field>
        </SettingsSection>
        <SettingsSection
          icon={<Building2 />}
          title="Business Details"
          description="Shown on quotations, invoices, and studio records."
        >
          <Field label="Phone">
            <Input name="phone" defaultValue={value.phone ?? ""} />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" defaultValue={value.email ?? ""} />
          </Field>
          <Field label="Address" wide>
            <Textarea name="address" rows={3} defaultValue={value.address ?? ""} />
          </Field>
        </SettingsSection>
        <SettingsSection
          icon={<Landmark />}
          title="Bank Details"
          description="Payment information for invoices."
        >
          <Field label="Bank name">
            <Input name="bank_name" defaultValue={value.bank_name ?? ""} />
          </Field>
          <Field label="Account holder">
            <Input name="bank_account_holder" defaultValue={value.bank_account_holder ?? ""} />
          </Field>
          <Field label="Account number">
            <Input name="bank_account_number" defaultValue={value.bank_account_number ?? ""} />
          </Field>
          <Field label="Branch">
            <Input name="bank_branch" defaultValue={value.bank_branch ?? ""} />
          </Field>
        </SettingsSection>
        <div className="flex justify-end">
          <Button type="submit" disabled={save.isPending}>
            <Save />
            {save.isPending ? "Saving..." : "Save settings"}
          </Button>
        </div>
      </form>
    </>
  );
}

function SettingsSection({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 md:p-6">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary-strong">
          {icon}
        </div>
        <div>
          <h2 className="font-extrabold">{title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  wide = false,
  children,
}: {
  label: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={wide ? "md:col-span-2" : undefined}>
      <span className="mb-2 block text-xs font-bold">{label}</span>
      {children}
    </label>
  );
}

function ColorField({ name, defaultValue }: { name: string; defaultValue: string }) {
  return (
    <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-2">
      <Input
        type="color"
        aria-label={name.replaceAll("_", " ")}
        defaultValue={defaultValue}
        className="p-1"
        onChange={(event) => {
          const text = event.currentTarget.nextElementSibling as HTMLInputElement | null;
          if (text) text.value = event.currentTarget.value;
        }}
      />
      <Input name={name} defaultValue={defaultValue} pattern="^#[0-9A-Fa-f]{6}$" />
    </div>
  );
}
