import { createFileRoute } from "@tanstack/react-router";
import { QuotationWizard } from "@/features/quotations/quotation-wizard";

export const Route = createFileRoute("/dashboard/quotations/new")({
  head: () => ({
    meta: [
      { title: "New quotation - ShootPlanner.lk" },
      { name: "description", content: "Create a professional studio quotation." },
      { property: "og:title", content: "New quotation - ShootPlanner.lk" },
      { property: "og:description", content: "A guided two-step quotation builder." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QuotationWizard,
});
