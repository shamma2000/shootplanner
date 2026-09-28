import { expect, test, type Page } from "@playwright/test";

const stamp = "2026-09-29T10:00:00Z";
const clients = [
  {
    id: "client-1",
    bride_name: "Asha",
    groom_name: "Nimal",
    primary_phone: "0771234567",
    optional_phone: null,
    email: null,
    address: null,
    created_at: stamp,
    updated_at: stamp,
  },
  {
    id: "client-2",
    bride_name: "Maya",
    groom_name: "Dev",
    primary_phone: "0772222222",
    optional_phone: null,
    email: null,
    address: null,
    created_at: stamp,
    updated_at: stamp,
  },
];
const initialEvents = [
  {
    id: "event-1",
    client_id: "client-1",
    event_type: "Wedding",
    event_date: "2026-09-29",
    location: "Colombo",
    hotel: null,
    status: "Confirmed",
    original_date: null,
    tentative_date: null,
    postpone_reason: null,
    created_at: stamp,
    updated_at: stamp,
  },
  {
    id: "event-2",
    client_id: "client-2",
    event_type: "Pre-shoot",
    event_date: "2026-10-10",
    location: "Galle",
    hotel: null,
    status: "Draft",
    original_date: null,
    tentative_date: null,
    postpone_reason: null,
    created_at: stamp,
    updated_at: stamp,
  },
];
const quotations = [
  {
    id: "quote-1",
    event_id: "event-1",
    subtotal: 150000,
    discount: 0,
    total: 150000,
    package_name: "Wedding",
    service_type: "Photography",
    notes: null,
    status: "Accepted",
    items: [],
    created_at: stamp,
    updated_at: stamp,
  },
  {
    id: "quote-2",
    event_id: "event-2",
    subtotal: 50000,
    discount: 0,
    total: 50000,
    package_name: "Portraits",
    service_type: "Photography",
    notes: null,
    status: "Draft",
    items: [],
    created_at: stamp,
    updated_at: stamp,
  },
];
const initialInvoices = [
  {
    id: "invoice-1",
    quotation_id: "quote-1",
    invoice_number: "INV-001",
    amount: 150000,
    advance_paid: 50000,
    balance_due: 100000,
    due_date: "2026-09-30",
    notes: null,
    status: "Pending",
    deliveries: [],
    created_at: stamp,
    updated_at: stamp,
  },
];

async function mockWorkspace(page: Page, empty = false) {
  const savedEvents = empty ? [] : [...initialEvents];
  const savedClients = empty ? [] : [...clients];
  const savedInvoices = empty ? [] : [...initialInvoices];
  const writes: Array<{ path: string; body: Record<string, unknown> }> = [];
  await page.clock.setFixedTime(new Date(stamp));
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname.split("/api/v1")[1] ?? "";
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: {
          "access-control-allow-origin": "http://localhost:3001",
          "access-control-allow-credentials": "true",
          "access-control-allow-headers": "content-type",
          "access-control-allow-methods": "GET,POST,PATCH",
        },
      });
      return;
    }
    let data: unknown = [];
    if (path === "/auth/me")
      data = {
        id: "user-1",
        studio_id: "studio-1",
        studio_name: "Example Studio",
        subdomain: "example",
        name: "Studio Owner",
        email: "owner@example.test",
        phone: "",
        role: "owner",
      };
    if (path === "/clients") data = savedClients;
    if (path === "/events") data = savedEvents;
    if (path === "/quotations") data = empty ? [] : quotations;
    if (path === "/invoices") data = savedInvoices;
    if (route.request().method() === "POST" && path.startsWith("/events")) {
      const body = route.request().postDataJSON();
      writes.push({ path, body });
      if (body.client) savedClients.push({ ...clients[0], ...body.client, id: "new-client" });
      const event = {
        ...initialEvents[0],
        ...body,
        client_id: body.client ? "new-client" : body.client_id,
        id: "saved-event",
      };
      savedEvents.push(event);
      data = event;
    }
    await route.fulfill({ json: data });
  });
  return { writes };
}

test("dashboard calendar navigates, filters, opens events, and survives reload after saving", async ({
  page,
}, testInfo) => {
  const { writes } = await mockWorkspace(page);
  await page.setViewportSize({ width: 1900, height: 1080 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/dashboard");
  const calendar = page.getByRole("region", { name: "Event overview", exact: true });
  await expect(calendar.getByRole("heading", { name: "September 2026" })).toBeVisible();
  await expect(calendar.locator(".fc-daygrid-day")).toHaveCount(42);
  await expect(calendar.locator(".fc-event").filter({ hasText: "Asha" })).toHaveCount(1);
  await calendar.getByRole("button", { name: "Next period" }).click();
  await expect(calendar.getByRole("heading", { name: "October 2026" })).toBeVisible();
  await expect(calendar.locator(".event-status-draft .fc-event-main").first()).toHaveCSS(
    "color",
    "rgb(31, 41, 55)",
  );
  await calendar.getByRole("button", { name: "Today", exact: true }).click();
  await calendar.getByRole("button", { name: "Week", exact: true }).click();
  await expect(calendar.locator(".fc-daygrid-day")).toHaveCount(7);
  await calendar.screenshot({ path: testInfo.outputPath("calendar-week.png") });
  await calendar.getByRole("button", { name: "List", exact: true }).click();
  await expect(calendar.locator(".fc-list-event")).toHaveCount(1);
  await calendar.screenshot({ path: testInfo.outputPath("calendar-list.png") });
  await calendar.getByLabel("Search events").fill("0772222222");
  await expect(calendar.getByText("No events in this period.")).toBeVisible();
  await calendar.getByLabel("Search events").fill("");
  await calendar.getByRole("button", { name: "Month", exact: true }).click();
  await calendar.locator(".fc-event").filter({ hasText: "Asha" }).click();
  await expect(page.getByRole("dialog").getByText("Colombo")).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await calendar.getByRole("button", { name: "Add Event", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Client", { exact: true }).selectOption("client-1");
  await dialog.getByLabel("Location", { exact: true }).fill("Kandy");
  await dialog.getByRole("button", { name: "Save event" }).click();
  await expect(dialog).toHaveCount(0);
  expect(writes[0]?.path).toBe("/events");
  expect(writes[0]?.body["event_type"]).toBe("Custom Event");
  await page.reload();
  await expect(calendar.locator(".fc-event").filter({ hasText: "Asha" })).toHaveCount(2);
  await page.screenshot({ path: testInfo.outputPath("dashboard-desktop.png"), fullPage: true });
  expect(errors).toEqual([]);
});

test("calendar and invoice controls fit narrow mobile and tablet viewports", async ({
  page,
}, testInfo) => {
  await mockWorkspace(page);
  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/dashboard");
    await expect(page.locator(".fc-daygrid-day")).toHaveCount(42);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.goto("/dashboard/invoices");
    await expect(page.getByRole("button", { name: "New Invoice", exact: true })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`invoices-${width}.png`), fullPage: true });
  }
});

test("new client event creation works from an empty mobile workspace", async ({
  page,
}, testInfo) => {
  const { writes } = await mockWorkspace(page, true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  const calendar = page.getByRole("region", { name: "Event overview", exact: true });
  await expect(calendar.locator(".fc-daygrid-day")).toHaveCount(42);
  await page.screenshot({ path: testInfo.outputPath("dashboard-mobile.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await calendar.getByRole("button", { name: "Add Event", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("First client name").fill("Asha");
  await dialog.getByLabel("Second client name").fill("Nimal");
  await dialog.getByLabel("Phone", { exact: true }).fill("0771234567");
  await dialog.getByLabel("Location", { exact: true }).fill("Kandy");
  await dialog.getByRole("button", { name: "Save event" }).click();
  await expect(dialog).toHaveCount(0);
  expect(writes[0]?.path).toBe("/events/with-client");
  await expect(calendar.locator(".fc-event").filter({ hasText: "Asha" })).toHaveCount(1);
  await page.goto("/dashboard/calendar");
  await expect(page.locator(".fc-event").filter({ hasText: "Asha" })).toHaveCount(1);
});

test("quotation and invoice date filters use the event date and phone search", async ({
  page,
}, testInfo) => {
  await mockWorkspace(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/dashboard");
  const panel = page.getByRole("region", { name: "Recent quotations" });
  await panel.getByLabel("Quotations month").selectOption("10");
  await panel.getByRole("button", { name: "Filter", exact: true }).click();
  await expect(panel.getByText("Maya & Dev", { exact: true })).toBeVisible();
  await expect(panel.getByText("Asha & Nimal", { exact: true })).toHaveCount(0);
  await page.goto("/dashboard/invoices");
  await page.getByLabel("Search invoices").fill("0771234567");
  await page.getByLabel("Invoices month").selectOption("09");
  await page.getByRole("button", { name: "Filter", exact: true }).click();
  await expect(page.getByText("Asha & Nimal", { exact: true })).toBeVisible();
  await page.getByLabel("Invoices month").selectOption("10");
  await page.getByRole("button", { name: "Filter", exact: true }).click();
  await expect(page.getByText("No invoices found.")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("invoices-desktop.png"), fullPage: true });
  await page.getByRole("button", { name: "New Invoice", exact: true }).click();
  await expect(page.getByRole("dialog").getByLabel("Quotation", { exact: true })).toBeVisible();
});

test("failed event saves keep the form open and do not add a calendar entry", async ({ page }) => {
  await mockWorkspace(page);
  await page.route("**/api/v1/events", async (route) => {
    if (route.request().method() === "POST")
      await route.fulfill({ status: 500, json: { detail: "Unable to save event" } });
    else await route.fallback();
  });
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Add Event", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Client", { exact: true }).selectOption("client-1");
  await dialog.getByLabel("Location", { exact: true }).fill("Kandy");
  await dialog.getByRole("button", { name: "Save event" }).click();
  await expect(dialog.getByRole("alert")).toHaveText("Unable to save event");
  await expect(dialog.getByLabel("Location", { exact: true })).toHaveValue("Kandy");
});
