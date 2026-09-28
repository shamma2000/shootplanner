import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PackageOpen, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { PageIntro } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  addOnsQuery,
  createAddOn,
  createPackage,
  deleteAddOn,
  deletePackage,
  packagesQuery,
} from "@/features/workspace/workspace-api";
import { ApiError } from "@/lib/api";
import { formatLkr } from "@/lib/format";

export const Route = createFileRoute("/dashboard/packages")({
  head: () => ({
    meta: [
      { title: "Packages - ShootPlanner.lk" },
      { name: "description", content: "Manage studio packages and add-ons." },
    ],
  }),
  component: Page,
});

function Page() {
  const packages = useQuery(packagesQuery);
  const addOns = useQuery(addOnsQuery);
  const queryClient = useQueryClient();
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [showAddOnForm, setShowAddOnForm] = useState(false);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["workspace"] });
  const removePackage = useMutation({
    mutationFn: deletePackage,
    onSuccess: async () => {
      await refresh();
      toast.success("Package deleted");
    },
    onError: showError,
  });
  const removeAddOn = useMutation({
    mutationFn: deleteAddOn,
    onSuccess: async () => {
      await refresh();
      toast.success("Add-on deleted");
    },
    onError: showError,
  });

  return (
    <>
      <PageIntro
        title="Packages"
        description="Create reusable pricing, deliverables, and extras for quotations."
      />
      <Tabs defaultValue="packages">
        <TabsList>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="add-ons">Add-ons</TabsTrigger>
        </TabsList>
        <TabsContent value="packages" className="mt-5 space-y-5">
          <div className="flex justify-end">
            <Button onClick={() => setShowPackageForm((current) => !current)}>
              <Plus />
              New package
            </Button>
          </div>
          {showPackageForm && <PackageForm onSaved={() => setShowPackageForm(false)} />}
          <CatalogState pending={packages.isPending} error={packages.isError} />
          {!packages.isPending && !packages.isError && packages.data?.length === 0 && (
            <EmptyState label="No packages yet" />
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            {packages.data?.map((item) => (
              <article key={item.id} className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-start gap-4">
                  <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary-strong">
                    <PackageOpen className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-extrabold">{item.name}</h2>
                        <p className="mt-1 text-xs font-bold text-primary-strong">
                          {item.service_type} · {formatLkr(item.base_price)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${item.name}`}
                        onClick={() => removePackage.mutate(item.id)}
                        disabled={removePackage.isPending}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    {item.description && (
                      <p className="mt-3 text-sm text-muted-foreground">{item.description}</p>
                    )}
                    {item.deliverables.length > 0 && (
                      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                        {item.deliverables.map((deliverable) => (
                          <li key={deliverable} className="text-xs font-semibold text-foreground">
                            {deliverable}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="add-ons" className="mt-5 space-y-5">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddOnForm((current) => !current)}>
              <Plus />
              New add-on
            </Button>
          </div>
          {showAddOnForm && <AddOnForm onSaved={() => setShowAddOnForm(false)} />}
          <CatalogState pending={addOns.isPending} error={addOns.isError} />
          {!addOns.isPending && !addOns.isError && addOns.data?.length === 0 && (
            <EmptyState label="No add-ons yet" />
          )}
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            {addOns.data?.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 border-b border-border px-5 py-4 last:border-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{item.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.add_on_type}</p>
                </div>
                <span className="text-sm font-extrabold">{formatLkr(item.default_price)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${item.name}`}
                  onClick={() => removeAddOn.mutate(item.id)}
                  disabled={removeAddOn.isPending}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

function PackageForm({ onSaved }: { onSaved: () => void }) {
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: createPackage,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["workspace", "packages"] });
      toast.success("Package created");
      onSaved();
    },
    onError: showError,
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    save.mutate({
      name: String(data.get("name") ?? "").trim(),
      service_type: String(data.get("service_type")) as
        "Photography" | "Videography" | "Both" | "Other",
      base_price: Number(data.get("base_price")),
      description: String(data.get("description") ?? "").trim() || null,
      deliverables: String(data.get("deliverables") ?? "")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      is_active: true,
    });
  };

  return (
    <form onSubmit={submit} className="rounded-lg border border-border bg-card p-5">
      <h2 className="font-extrabold">New package</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Field label="Package name">
          <Input name="name" required />
        </Field>
        <Field label="Service type">
          <select name="service_type" className={selectClass} defaultValue="Photography">
            <option>Photography</option>
            <option>Videography</option>
            <option>Both</option>
            <option>Other</option>
          </select>
        </Field>
        <Field label="Base price (LKR)">
          <Input name="base_price" type="number" min="0" required />
        </Field>
        <div className="md:col-span-3">
          <Field label="Description">
            <Input name="description" />
          </Field>
        </div>
        <div className="md:col-span-3">
          <Field label="Deliverables (one per line)">
            <Textarea
              name="deliverables"
              rows={4}
              placeholder="Edited photos&#10;Wedding album"
            />
          </Field>
        </div>
      </div>
      <Button type="submit" className="mt-4" disabled={save.isPending}>
        {save.isPending ? "Saving..." : "Save package"}
      </Button>
    </form>
  );
}

function AddOnForm({ onSaved }: { onSaved: () => void }) {
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: createAddOn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["workspace", "add-ons"] });
      toast.success("Add-on created");
      onSaved();
    },
    onError: showError,
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    save.mutate({
      name: String(data.get("name") ?? "").trim(),
      add_on_type: String(data.get("add_on_type")) as "Album" | "Enlargement" | "General",
      default_price: Number(data.get("default_price")),
      is_active: true,
    });
  };

  return (
    <form onSubmit={submit} className="rounded-lg border border-border bg-card p-5">
      <h2 className="font-extrabold">New add-on</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Field label="Name">
          <Input name="name" required />
        </Field>
        <Field label="Type">
          <select name="add_on_type" className={selectClass} defaultValue="General">
            <option>Album</option>
            <option>Enlargement</option>
            <option>General</option>
          </select>
        </Field>
        <Field label="Default price (LKR)">
          <Input name="default_price" type="number" min="0" required />
        </Field>
      </div>
      <Button type="submit" className="mt-4" disabled={save.isPending}>
        {save.isPending ? "Saving..." : "Save add-on"}
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <Label className="mb-2 block text-xs font-bold">{label}</Label>
      {children}
    </label>
  );
}

function CatalogState({ pending, error }: { pending: boolean; error: boolean }) {
  if (pending) return <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>;
  if (error)
    return (
      <p className="py-8 text-center text-sm font-semibold text-destructive">
        Unable to load catalog.
      </p>
    );
  return null;
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border px-5 py-10 text-center">
      <p className="text-sm font-bold">{label}</p>
    </div>
  );
}

function showError(error: Error) {
  toast.error(error instanceof ApiError ? error.message : "Unable to save changes");
}

const selectClass =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring";
