import { queryOptions } from "@tanstack/react-query";
import { apiRequest, downloadPdf } from "@/lib/api";

export type Money = number | string;
export type EventStatus = "Draft" | "Confirmed" | "Postponed";
export type QuotationStatus = "Draft" | "Sent" | "Accepted";
export type InvoiceStatus = "Pending" | "Paid" | "Overdue";
export type DeliveryStatus = "Pending" | "In Progress" | "Delivered";

export type ClientRecord = {
  id: string;
  bride_name: string;
  groom_name: string;
  primary_phone: string;
  optional_phone: string | null;
  email: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
};

export type EventRecord = {
  id: string;
  client_id: string;
  event_type: "Wedding" | "Engagement" | "Homecoming" | "Pre-shoot" | "Other" | "Custom Event";
  event_date: string;
  location: string;
  hotel: string | null;
  status: EventStatus;
  original_date: string | null;
  tentative_date: string | null;
  postpone_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type QuotationItemRecord = {
  id: string;
  item_type: "package" | "add_on" | "custom" | "transport" | "deliverable";
  name: string;
  category: string | null;
  quantity: number;
  unit_price: Money;
  total: Money;
  created_at: string;
  updated_at: string;
};

export type QuotationRecord = {
  id: string;
  event_id: string;
  subtotal: Money;
  discount: Money;
  total: Money;
  package_name: string | null;
  service_type: string | null;
  notes: string | null;
  status: QuotationStatus;
  items: QuotationItemRecord[];
  created_at: string;
  updated_at: string;
};

export type DeliveryItemRecord = {
  id: string;
  invoice_id: string;
  name: string;
  status: DeliveryStatus;
  due_date: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
};

export type InvoiceRecord = {
  id: string;
  quotation_id: string;
  invoice_number: string;
  amount: Money;
  advance_paid: Money;
  balance_due: Money;
  due_date: string;
  notes: string | null;
  status: InvoiceStatus;
  deliveries: DeliveryItemRecord[];
  created_at: string;
  updated_at: string;
};

export type ServicePackageRecord = {
  id: string;
  name: string;
  service_type: "Photography" | "Videography" | "Both" | "Other";
  base_price: Money;
  description: string | null;
  deliverables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AddOnRecord = {
  id: string;
  name: string;
  add_on_type: "Album" | "Enlargement" | "General";
  default_price: Money;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type StudioRecord = {
  id: string;
  subdomain: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  brand_color_primary: string | null;
  brand_color_secondary: string | null;
  bank_name: string | null;
  bank_account_holder: string | null;
  bank_account_number: string | null;
  bank_branch: string | null;
  created_at: string;
  updated_at: string;
};

export const clientsQuery = queryOptions({
  queryKey: ["workspace", "clients"],
  queryFn: () => apiRequest<ClientRecord[]>("/clients"),
});

export const eventsQuery = queryOptions({
  queryKey: ["workspace", "events"],
  queryFn: () => apiRequest<EventRecord[]>("/events"),
});

export const quotationsQuery = queryOptions({
  queryKey: ["workspace", "quotations"],
  queryFn: () => apiRequest<QuotationRecord[]>("/quotations"),
});

export const invoicesQuery = queryOptions({
  queryKey: ["workspace", "invoices"],
  queryFn: () => apiRequest<InvoiceRecord[]>("/invoices"),
});

export const packagesQuery = queryOptions({
  queryKey: ["workspace", "packages"],
  queryFn: () => apiRequest<ServicePackageRecord[]>("/catalog/packages"),
});

export const addOnsQuery = queryOptions({
  queryKey: ["workspace", "add-ons"],
  queryFn: () => apiRequest<AddOnRecord[]>("/catalog/add-ons"),
});

export const studioQuery = queryOptions({
  queryKey: ["workspace", "studio"],
  queryFn: () => apiRequest<StudioRecord>("/studio"),
});

export type QuotationWorkflowPayload = {
  client: {
    bride_name: string;
    groom_name: string;
    primary_phone: string;
    optional_phone: string | null;
    email: string | null;
    address: string | null;
  };
  events: Array<{
    event_type: EventRecord["event_type"];
    event_date: string;
    location: string;
    hotel: string | null;
  }>;
  items: Array<{
    item_type: QuotationItemRecord["item_type"];
    name: string;
    category: string | null;
    quantity: number;
    unit_price: number;
  }>;
  discount: number;
  service_type: string | null;
  notes: string | null;
  status: QuotationStatus;
};

export function createQuotationWorkflow(payload: QuotationWorkflowPayload) {
  return apiRequest<QuotationRecord>("/quotations/workflow", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateQuotation(id: string, status: QuotationStatus) {
  return apiRequest<QuotationRecord>(`/quotations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function convertQuotationToInvoice(id: string) {
  return apiRequest<InvoiceRecord>(`/invoices/from-quotation/${id}`, { method: "POST" });
}

export function updateInvoice(
  id: string,
  payload: Partial<Pick<InvoiceRecord, "advance_paid" | "due_date" | "notes" | "status">>,
) {
  return apiRequest<InvoiceRecord>(`/invoices/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function downloadInvoice(invoice: InvoiceRecord) {
  const filename = invoice.invoice_number
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return downloadPdf(`/invoices/${invoice.id}/pdf`, `${filename || "invoice"}.pdf`);
}

export function updateDelivery(id: string, status: DeliveryStatus, dueDate?: string | null) {
  return apiRequest<DeliveryItemRecord>(`/invoices/deliveries/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status, due_date: dueDate ?? null }),
  });
}

export function updateEvent(
  id: string,
  payload: Partial<
    Pick<
      EventRecord,
      "event_date" | "location" | "hotel" | "status" | "tentative_date" | "postpone_reason"
    >
  >,
) {
  return apiRequest<EventRecord>(`/events/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export type EventPayload = Pick<
  EventRecord,
  "client_id" | "event_type" | "event_date" | "location" | "hotel" | "status"
>;

export function createEvent(payload: EventPayload) {
  return apiRequest<EventRecord>("/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createEventWithClient(
  payload: Omit<EventPayload, "client_id"> & { client: QuotationWorkflowPayload["client"] },
) {
  return apiRequest<EventRecord>("/events/with-client", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type PackagePayload = Omit<ServicePackageRecord, "id" | "created_at" | "updated_at">;
export type AddOnPayload = Omit<AddOnRecord, "id" | "created_at" | "updated_at">;

export function createPackage(payload: PackagePayload) {
  return apiRequest<ServicePackageRecord>("/catalog/packages", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deletePackage(id: string) {
  return apiRequest<void>(`/catalog/packages/${id}`, { method: "DELETE" });
}

export function createAddOn(payload: AddOnPayload) {
  return apiRequest<AddOnRecord>("/catalog/add-ons", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteAddOn(id: string) {
  return apiRequest<void>(`/catalog/add-ons/${id}`, { method: "DELETE" });
}

export function updateStudio(payload: Partial<StudioRecord>) {
  return apiRequest<StudioRecord>("/studio", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function clientDisplayName(client: ClientRecord | undefined) {
  if (!client) return "Unknown client";
  return [client.bride_name, client.groom_name].filter(Boolean).join(" & ");
}
