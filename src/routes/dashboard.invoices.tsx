import { createFileRoute } from "@tanstack/react-router";
import { InvoicesPage } from "@/features/invoices/invoices-page";

export const Route = createFileRoute("/dashboard/invoices")({
  head: () => ({
    meta: [
      { title: "Invoices - ShootPlanner.lk" },
      { name: "description", content: "Track studio invoices and client payments." },
      { property: "og:title", content: "Invoices - ShootPlanner.lk" },
      { property: "og:description", content: "Clear invoicing and payment tracking for studios." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InvoicesPage,
});
