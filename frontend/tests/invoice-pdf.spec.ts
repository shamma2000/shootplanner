import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const stamp = "2026-09-29T10:00:00Z";

async function mockInvoices(page: Page) {
  const writes: string[] = [];
  const invoices = [1, 2].map((id) => ({
    id: `invoice-${id}`,
    quotation_id: `quote-${id}`,
    invoice_number: `INV-00${id}`,
    amount: "160000.50",
    advance_paid: "50000.25",
    balance_due: "110000.25",
    due_date: "2026-12-10",
    notes: null,
    status: "Pending",
    deliveries: [],
    created_at: stamp,
    updated_at: stamp,
  }));
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.split("/api/v1")[1] ?? "";
    if (request.method() === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: {
          "access-control-allow-origin": "http://localhost:3001",
          "access-control-allow-credentials": "true",
          "access-control-allow-headers": "content-type",
          "access-control-allow-methods": "GET,PATCH",
        },
      });
      return;
    }
    if (path.endsWith("/pdf")) {
      writes.push(`GET ${path}`);
      const invoice = invoices.find((item) => path.includes(item.id));
      await route.fulfill({
        contentType: "application/pdf",
        body: `%PDF-1.4\n${invoice?.invoice_number}\nAdvance ${invoice?.advance_paid}\n%%EOF`,
      });
      return;
    }
    let data: unknown = [];
    if (path === "/auth/me")
      data = {
        id: "owner",
        studio_id: "studio",
        studio_name: "Example Studio",
        subdomain: "example",
        name: "Studio Owner",
        email: "owner@example.test",
        phone: "",
        role: "owner",
      };
    if (path === "/invoices") data = invoices;
    if (path === "/clients")
      data = [1, 2].map((id) => ({
        id: `client-${id}`,
        bride_name: id === 1 ? "Asha" : "Maya",
        groom_name: id === 1 ? "Nimal" : "Dev",
        primary_phone: "0771234567",
        optional_phone: null,
        email: null,
        address: null,
        created_at: stamp,
        updated_at: stamp,
      }));
    if (path === "/events")
      data = [1, 2].map((id) => ({
        id: `event-${id}`,
        client_id: `client-${id}`,
        event_type: "Wedding",
        event_date: "2026-12-20",
        location: "Kandy",
        hotel: null,
        status: "Confirmed",
        created_at: stamp,
        updated_at: stamp,
      }));
    if (path === "/quotations")
      data = [1, 2].map((id) => ({
        id: `quote-${id}`,
        event_id: `event-${id}`,
        subtotal: "160000.50",
        discount: "0",
        total: "160000.50",
        package_name: "Wedding",
        service_type: "Both",
        status: "Accepted",
        items: [],
        created_at: stamp,
        updated_at: stamp,
      }));
    if (request.method() === "PATCH") {
      writes.push(`PATCH ${path}`);
      const invoice = invoices.find((item) => path.endsWith(item.id));
      Object.assign(invoice ?? {}, request.postDataJSON(), { updated_at: "2026-09-29T11:00:00Z" });
      if (invoice)
        invoice.balance_due = String(Number(invoice.amount) - Number(invoice.advance_paid));
      data = invoice;
    }
    await route.fulfill({ json: data });
  });
  return { invoices, writes };
}

test("save and download persists the edited advance before requesting the customer PDF", async ({
  page,
}, info) => {
  const { invoices, writes } = await mockInvoices(page);
  await page.goto("/dashboard/invoices");
  await expect(page.getByRole("button", { name: "Export CSV" })).toHaveCount(0);
  const invoice = page.getByRole("form", { name: "Invoice INV-001", exact: true });
  await invoice.getByLabel("Advance paid (LKR)").fill("75000.50");
  const downloaded = page.waitForEvent("download");
  await invoice.getByRole("button", { name: "Save & download PDF" }).click();
  const file = await downloaded;
  expect(file.suggestedFilename()).toBe("INV-001.pdf");
  const path = info.outputPath("downloaded-invoice.pdf");
  await file.saveAs(path);
  const content = await readFile(path, "utf8");
  expect(content).toContain("%PDF-");
  expect(content).toContain("Advance 75000.5");
  expect(content).not.toContain("INV-002");
  expect(invoices[0]?.advance_paid).toBe(75000.5);
  expect(writes).toEqual(["PATCH /invoices/invoice-1", "GET /invoices/invoice-1/pdf"]);
  await expect(invoice.getByLabel("Advance paid (LKR)")).toHaveValue("75000.5");
});

test("header download chooses one customer, and invoice controls fit desktop and mobile", async ({
  page,
}, info) => {
  test.setTimeout(60_000);
  const { writes } = await mockInvoices(page);
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/dashboard/invoices");
    await expect(page.getByRole("button", { name: "Save & download PDF" }).first()).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({ path: info.outputPath(`invoice-pdf-${width}.png`), fullPage: true });
  }
  await page.getByRole("button", { name: "Download Invoice", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Invoice", { exact: true }).selectOption("invoice-2");
  const downloaded = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Download PDF", exact: true }).click();
  expect((await downloaded).suggestedFilename()).toBe("INV-002.pdf");
  await expect(dialog).toHaveCount(0);
  expect(writes).toEqual(["GET /invoices/invoice-2/pdf"]);
});

test("failed saves never download stale payment details", async ({ page }) => {
  const { writes } = await mockInvoices(page);
  await page.route("**/api/v1/invoices/invoice-1", async (route) => {
    if (route.request().method() === "PATCH")
      await route.fulfill({ status: 422, json: { detail: "Unable to save payment" } });
    else await route.fallback();
  });
  await page.goto("/dashboard/invoices");
  const invoice = page.getByRole("form", { name: "Invoice INV-001", exact: true });
  await invoice.getByLabel("Advance paid (LKR)").fill("75000.50");
  await invoice.getByRole("button", { name: "Save & download PDF" }).click();
  await expect(page.getByText("Unable to save payment", { exact: true })).toBeVisible();
  await expect(invoice.getByLabel("Advance paid (LKR)")).toHaveValue("75000.50");
  expect(writes).toEqual([]);
});

test("failed PDF downloads show an error and can be retried", async ({ page }) => {
  await mockInvoices(page);
  await page.route("**/api/v1/invoices/invoice-1/pdf", (route) =>
    route.fulfill({ status: 500, json: { detail: "PDF temporarily unavailable" } }),
  );
  await page.goto("/dashboard/invoices");
  const button = page
    .getByRole("form", { name: "Invoice INV-001", exact: true })
    .getByRole("button", { name: "Save & download PDF" });
  await button.click();
  await expect(page.getByText("PDF temporarily unavailable", { exact: true })).toBeVisible();
  await expect(button).toBeEnabled();
});
