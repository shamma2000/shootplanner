import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, CalendarIcon, Check, ChevronDown, Plus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  addOnsQuery,
  createQuotationWorkflow,
  packagesQuery,
  type QuotationWorkflowPayload,
} from "@/features/workspace/workspace-api";
import { ApiError } from "@/lib/api";
import { formatLkr } from "@/lib/format";

const schema = z.object({
  brideName: z.string().min(2, "Bride name is required"),
  groomName: z.string().min(2, "Groom name is required"),
  primaryPhone: z.string().min(9, "Enter a valid phone number"),
  optionalPhone: z.string(),
  email: z.string().email("Enter a valid email").or(z.literal("")),
  weddingDate: z.string().min(1, "Wedding date is required"),
  weddingLocation: z.string().min(2, "Location is required"),
  hotel: z.string(),
  engagementDate: z.string(),
  engagementLocation: z.string(),
  engagementHotel: z.string(),
  preShootDate: z.string(),
  preShootLocation: z.string(),
  packageId: z.string(),
  customName: z.string(),
  customPrice: z.coerce.number().min(0),
  discount: z.coerce.number().min(0),
  notes: z.string(),
});
type FormData = z.infer<typeof schema>;
const Field = ({
  label,
  error,
  children,
  required,
}: {
  label: string;
  error?: string | undefined;
  children: ReactNode;
  required?: boolean;
}) => (
  <div>
    <Label className="mb-2 block text-xs font-bold">
      {label}
      {required && <span className="text-destructive"> *</span>}
    </Label>
    {children}
    {error && <p className="mt-1 text-xs font-semibold text-destructive">{error}</p>}
  </div>
);
export function QuotationWizard() {
  const [step, setStep] = useState(1);
  const [eventType, setEventType] = useState<"Wedding" | "Other">("Wedding");
  const [service, setService] = useState("All");
  const [showPreShoot, setShowPreShoot] = useState(false);
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
  const [drone, setDrone] = useState(false);
  const [transport, setTransport] = useState(false);
  const navigate = useNavigate({ from: "/dashboard/quotations/new" });
  const queryClient = useQueryClient();
  const packageQuery = useQuery(packagesQuery);
  const addOnQuery = useQuery(addOnsQuery);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      brideName: "",
      groomName: "",
      primaryPhone: "",
      optionalPhone: "",
      email: "",
      weddingDate: "",
      weddingLocation: "",
      hotel: "",
      engagementDate: "",
      engagementLocation: "",
      engagementHotel: "",
      preShootDate: "",
      preShootLocation: "",
      packageId: "",
      customName: "",
      customPrice: 0,
      discount: 0,
      notes: "",
    },
  });
  const values = watch();
  const packages = packageQuery.data ?? [];
  const addOns = addOnQuery.data ?? [];
  const selected = packages.find((p) => p.id === values.packageId);
  const selectedExtras = addOns.filter((item) => selectedAddOns.has(item.id));
  const estimate =
    Number(selected?.base_price ?? 0) +
    selectedExtras.reduce((sum, item) => sum + Number(item.default_price), 0) +
    (drone ? 25000 : 0) +
    (transport ? 15000 : 0) +
    (Number(values.customPrice) || 0) -
    (Number(values.discount) || 0);
  const saveQuotation = useMutation({
    mutationFn: async (formValues: FormData) => {
      const events: QuotationWorkflowPayload["events"] = [
        {
          event_type: eventType,
          event_date: formValues.weddingDate,
          location: formValues.weddingLocation.trim(),
          hotel: formValues.hotel.trim() || null,
        },
      ];
      if (formValues.engagementDate && formValues.engagementLocation.trim()) {
        events.push({
          event_type: "Engagement",
          event_date: formValues.engagementDate,
          location: formValues.engagementLocation.trim(),
          hotel: formValues.engagementHotel.trim() || null,
        });
      }
      if (showPreShoot && formValues.preShootDate && formValues.preShootLocation.trim()) {
        events.push({
          event_type: "Pre-shoot",
          event_date: formValues.preShootDate,
          location: formValues.preShootLocation.trim(),
          hotel: null,
        });
      }

      const selectedPackage = packages.find((item) => item.id === formValues.packageId);
      const items: QuotationWorkflowPayload["items"] = [];
      if (selectedPackage) {
        items.push({
          item_type: "package",
          name: selectedPackage.name,
          category: selectedPackage.service_type,
          quantity: 1,
          unit_price: Number(selectedPackage.base_price),
        });
        items.push(
          ...selectedPackage.deliverables.map((name) => ({
            item_type: "deliverable" as const,
            name,
            category: "Package deliverable",
            quantity: 1,
            unit_price: 0,
          })),
        );
      }
      items.push(
        ...selectedExtras.map((item) => ({
          item_type: "add_on" as const,
          name: item.name,
          category: item.add_on_type,
          quantity: 1,
          unit_price: Number(item.default_price),
        })),
      );
      if (formValues.customName.trim() && Number(formValues.customPrice) > 0) {
        items.push({
          item_type: "custom",
          name: formValues.customName.trim(),
          category: "Custom package",
          quantity: 1,
          unit_price: Number(formValues.customPrice),
        });
      }
      if (drone) {
        items.push({
          item_type: "add_on",
          name: "Drone shoot",
          category: "General",
          quantity: 1,
          unit_price: 25000,
        });
      }
      if (transport) {
        items.push({
          item_type: "transport",
          name: "Transport / mileage",
          category: "Travel",
          quantity: 1,
          unit_price: 15000,
        });
      }

      return createQuotationWorkflow({
        client: {
          bride_name: formValues.brideName.trim(),
          groom_name: formValues.groomName.trim(),
          primary_phone: formValues.primaryPhone.trim(),
          optional_phone: formValues.optionalPhone.trim() || null,
          email: formValues.email.trim() || null,
          address: null,
        },
        events,
        items,
        discount: Number(formValues.discount) || 0,
        service_type: service,
        notes: formValues.notes.trim() || null,
        status: "Draft",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["workspace"] });
      toast.success("Quotation saved to your workspace");
      await navigate({ to: "/dashboard/quotations" });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Unable to save quotation");
    },
  });
  const submit = handleSubmit((formValues) => {
    const hasCustomPackage =
      formValues.customName.trim().length > 0 && Number(formValues.customPrice) > 0;
    if (!selected && !hasCustomPackage) {
      toast.error("Select a package or add a custom package and price");
      return;
    }
    saveQuotation.mutate(formValues);
  });
  return (
    <form
      onSubmit={
        step === 1
          ? (event) => {
              event.preventDefault();
              setStep(2);
            }
          : submit
      }
      className="mx-auto max-w-6xl pb-24"
    >
      <div className="mb-7 flex items-center justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">
            Step {step} of 2
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight">Create a quotation</h1>
        </div>
        <div className="flex items-center">
          <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-extrabold text-primary-foreground">
            {step > 1 ? <Check /> : 1}
          </span>
          <span className={`h-1 w-10 ${step > 1 ? "bg-primary" : "bg-border"}`} />
          <span
            className={`grid size-8 place-items-center rounded-full text-xs font-extrabold ${step > 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            2
          </span>
        </div>
      </div>
      {step === 1 ? (
        <div className="space-y-5">
          <div className="inline-flex rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => setEventType("Wedding")}
              className={`rounded-md px-5 py-2 text-sm font-bold ${eventType === "Wedding" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Wedding
            </button>
            <button
              type="button"
              onClick={() => setEventType("Other")}
              className={`rounded-md px-5 py-2 text-sm font-bold ${eventType === "Other" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Other event
            </button>
          </div>
          <Section title="Bride & groom details">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Bride name" error={errors.brideName?.message} required>
                <Input {...register("brideName")} />
              </Field>
              <Field label="Groom name" error={errors.groomName?.message} required>
                <Input {...register("groomName")} />
              </Field>
              <Field label="Primary phone" error={errors.primaryPhone?.message} required>
                <Input {...register("primaryPhone")} />
              </Field>
              <Field label="Optional phone">
                <Input {...register("optionalPhone")} />
              </Field>
              <Field label="Email address" error={errors.email?.message}>
                <Input type="email" {...register("email")} />
              </Field>
            </div>
          </Section>
          <Section title="Wedding details">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Wedding date" error={errors.weddingDate?.message}>
                <div className="relative">
                  <Input type="date" {...register("weddingDate")} />
                  <CalendarIcon className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" />
                </div>
              </Field>
              <Field label="Shoot location" error={errors.weddingLocation?.message}>
                <Input {...register("weddingLocation")} />
              </Field>
              <Field label="Hotel">
                <Input {...register("hotel")} />
              </Field>
            </div>
          </Section>
          <Section title="Engagement details">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Engagement date">
                <Input type="date" {...register("engagementDate")} />
              </Field>
              <Field label="Shoot location">
                <Input {...register("engagementLocation")} />
              </Field>
              <Field label="Hotel">
                <Input {...register("engagementHotel")} />
              </Field>
            </div>
          </Section>
          <Section
            title="Pre-shoot sessions"
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreShoot((current) => !current)}
              >
                <Plus />
                {showPreShoot ? "Remove" : "Add pre-shoot"}
              </Button>
            }
          >
            {showPreShoot ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Pre-shoot date">
                  <Input type="date" {...register("preShootDate")} />
                </Field>
                <Field label="Shoot location">
                  <Input {...register("preShootLocation")} />
                </Field>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted/50 p-7 text-center">
                <CalendarIcon className="mx-auto size-7 text-muted-foreground" />
                <p className="mt-3 text-sm font-semibold text-foreground">
                  No pre-shoot sessions added.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Click “Add pre-shoot” above to add one.
                </p>
              </div>
            )}
          </Section>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[330px_minmax(0,1fr)]">
          <aside className="h-fit rounded-xl bg-sidebar p-6 text-on-dark">
            <p className="text-sm font-extrabold text-primary">Client summary</p>
            <h2 className="mt-4 text-xl font-extrabold">
              {values.brideName} & {values.groomName}
            </h2>
            <dl className="mt-6 space-y-4 text-sm">
              {[
                ["Wedding date", values.weddingDate],
                ["Engagement date", values.engagementDate],
                ["Shoot location", values.weddingLocation],
                ["Hotel", values.hotel],
              ].map(([a, b]) => (
                <div key={a}>
                  <dt className="text-xs text-sidebar-muted">{a}</dt>
                  <dd className="mt-1 font-semibold">{b || "Not added"}</dd>
                </div>
              ))}
            </dl>
          </aside>
          <div className="space-y-5">
            <Section title="Pricing & packages">
              <Field label="Service type">
                <div className="flex flex-wrap gap-2">
                  {["All", "Photography", "Videography", "Both", "Engagement", "Others"].map(
                    (item) => (
                      <button
                        type="button"
                        key={item}
                        onClick={() => setService(item)}
                        className={`rounded-full px-4 py-2 text-xs font-bold ${service === item ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                      >
                        {item}
                      </button>
                    ),
                  )}
                </div>
              </Field>
              <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <Field label="Select a package">
                  <div className="relative">
                    <select
                      {...register("packageId")}
                      className="h-11 w-full appearance-none rounded-lg border border-input bg-muted px-3 text-sm font-semibold outline-hidden focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Choose a package</option>
                      {packages.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} - {formatLkr(Number(p.base_price))}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-3.5 size-4" />
                  </div>
                </Field>
                <Button
                  type="button"
                  className="self-end"
                  onClick={() => navigate({ to: "/dashboard/packages" })}
                >
                  <Plus />
                  Add package
                </Button>
              </div>
              <div className="my-6 h-px bg-border" />
              <p className="mb-3 text-xs font-bold">Or add a custom package</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input placeholder="Package name" {...register("customName")} />
                <Input type="number" placeholder="Price (LKR)" {...register("customPrice")} />
              </div>
            </Section>
            <Section title="Extras">
              {addOns.map((item) => (
                <CheckRow
                  key={item.id}
                  checked={selectedAddOns.has(item.id)}
                  setChecked={(checked) =>
                    setSelectedAddOns((current) => {
                      const next = new Set(current);
                      if (checked) next.add(item.id);
                      else next.delete(item.id);
                      return next;
                    })
                  }
                  title={item.name}
                  copy={item.add_on_type}
                  price={formatLkr(Number(item.default_price))}
                />
              ))}
              <CheckRow
                checked={drone}
                setChecked={setDrone}
                title="Drone shoot"
                copy="Aerial photography"
                price="Rs. 25,000"
              />
              <CheckRow
                checked={transport}
                setChecked={setTransport}
                title="Transport / mileage"
                copy="Travel fees for the crew"
                price="Calculated by distance"
              />
              {transport && (
                <div className="mt-4 grid gap-3 pl-8 sm:grid-cols-2">
                  <Input type="number" placeholder="Total KM" />
                  <Input type="number" placeholder="Rate per KM" />
                </div>
              )}
              <Button type="button" variant="outline" className="mt-5">
                <Plus />
                Add extra item
              </Button>
            </Section>
            <section className="rounded-xl bg-sidebar p-6 text-on-dark">
              <p className="text-xs font-bold text-sidebar-muted">Estimated total</p>
              <p className="mt-2 text-3xl font-extrabold text-primary">
                {formatLkr(Math.max(0, estimate))}
              </p>
              <div className="mt-6 grid gap-4">
                <Field label="Discount (LKR)">
                  <Input
                    className="bg-on-dark/10 text-on-dark"
                    type="number"
                    {...register("discount")}
                  />
                </Field>
                <Field label="Special notes">
                  <Textarea
                    className="bg-on-dark/10 text-on-dark"
                    placeholder="Add helpful notes for your client"
                    {...register("notes")}
                  />
                </Field>
              </div>
            </section>
          </div>
        </div>
      )}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 p-3 backdrop-blur lg:left-[260px]">
        <div className="mx-auto flex max-w-6xl justify-end gap-3">
          {step === 2 && (
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft />
              Previous
            </Button>
          )}
          {step === 1 ? (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setStep(2);
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary-strong"
            >
              Next
              <ArrowRight className="size-4" />
            </button>
          ) : (
            <Button type="submit" disabled={saveQuotation.isPending}>
              {saveQuotation.isPending ? "Saving..." : "Create quotation"}
              <ArrowRight />
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-soft md:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="font-extrabold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
function CheckRow({
  checked,
  setChecked,
  title,
  copy,
  price,
}: {
  checked: boolean;
  setChecked: (v: boolean) => void;
  title: string;
  copy: string;
  price: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 border-b border-border py-4">
      <Checkbox checked={checked} onCheckedChange={(v) => setChecked(v === true)} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{title}</span>
        <span className="block text-xs text-muted-foreground">{copy}</span>
      </span>
      <span className="text-xs font-bold text-primary-strong">{price}</span>
    </label>
  );
}
