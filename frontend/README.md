# Studio Spark

You are an expert Senior Frontend Developer and UI/UX Designer. Your task is to build the frontend for a new SaaS platform called "ShootPlanner.lk".

### 1. PROJECT OVERVIEW

ShootPlanner.lk is a studio management tool for photography and videography businesses in Sri Lanka. It helps studio owners manage quotations, invoices, event calendars, and financial tracking. The goal is to make it feel premium, approachable, and incredibly easy to use on a mobile phone, which is what most photographers use on location.

### 2. TECH STACK & ARCHITECTURE

- Framework: Next.js 14+ (App Router)

- Language: TypeScript

- Styling: Tailwind CSS

- UI Components: Shadcn/UI (assume these components are available: Button, Card, Input, Select, Calendar, Dialog, Drawer, Badge, Table, Tabs)

- Icons: Lucide React

- Forms: React Hook Form + Zod for validation

- State Management: Zustand (for global UI state) and React Query (for server state)

### 3. DESIGN SYSTEM & BRAND IDENTITY

- Primary Color: Vibrant Orange (`#F59E0B` or `#EA580C` for hover states) - used for primary CTAs, active states, and highlights.

- Secondary Color: Dark Navy/Slate (`#0F172A` or `#1E293B`) - used for sidebars, headers, dark hero cards, and primary text.

- Background: Off-white (`#F8FAFC`) for the main app, pure white (`#FFFFFF`) for cards.

- Typography: `Inter` or `Plus Jakarta Sans`. Headings should be bold and tracking-tight. Body text should be legible and slightly muted (`text-slate-500`).

- Borders: Very subtle (`border-slate-200`), rounded corners (`rounded-xl` or `rounded-2xl`).

- Shadows: Soft, diffused shadows (`shadow-sm`, `shadow-md`).

- Vibe: Clean, modern, professional, but soft. No harsh lines. Use ample whitespace. Make forms feel like a guided journey, not a spreadsheet.

- Responsive: Mobile-first. Always design the mobile view first, then use `md:` and `lg:` breakpoints for desktop.

### 4. CORE DATA MODELS (For Mock Data & Types)

Create a `types/index.ts` file with the following interfaces:

- `Studio`: { id, name, subdomain, logoUrl, bankDetails, trialEndsAt }

- `Client`: { id, studioId, brideName, groomName, primaryPhone, optionalPhone, email, address }

- `Event`: { id, clientId, type: 'Wedding' | 'Engagement' | 'Homecoming' | 'Pre-shoot' | 'Other', date, location, hotel, status: 'Draft' | 'Confirmed' | 'Postponed' }

- `Quotation`: { id, eventId, packages: Package[], extras: Extra[], subtotal, discount, total, status: 'Draft' | 'Sent' | 'Accepted' }

- `Package`: { id, name, price, serviceType: 'Photography' | 'Videography' | 'Both' | 'All' }

- `Extra`: { id, name, price, type: 'Drone' | 'Transport' | 'Custom' }

### 5. PAGE & COMPONENT REQUIREMENTS

#### A. Public Landing Page (`/`)

- Hero Section:

  - Background: White with a subtle, faint star watermark pattern.

  - Top Badge: Pill shape, "Trusted by photography & videography studios across Sri Lanka" with a small orange dot.

  - Headline: "Run your studio like a pro" (Make "pro" orange).

  - Subheadline: "Manage quotations and invoices, track payments, organize calendar & scheduling, and handle deliverables — beautifully organized in one branded workspace made for wedding photographers and videographers."

  - CTAs: Primary "Create Your Studio" (solid orange), Secondary "View pricing plans" (text link with underline).

  - Trust text: "Free 7-day trial • No credit card required • Cancel anytime"

- Features Section:

  - Title: "EVERYTHING YOU NEED" (small, orange, uppercase, tracking-widest).

  - Subtitle: "Powerful tools, beautifully simple" (large, bold, navy).

  - Description: "Focus on capturing the moment — let ShootPlanner handle the paperwork."

  - Grid of feature cards (Smart Quotations, WhatsApp & PDF Sharing, Automated Invoicing, Interactive Calendar, Postponed Deliveries, Income & Expense Tracking). Each card should have an icon in a soft orange circle, a title, and a short description.

- Pricing Section:

  - Title: "Simple, honest pricing"

  - Subtitle: "Start free and upgrade as your studio grows."

  - Pricing cards (Free Trial: Rs. 0 for 7 days, Basic, Pro). Highlight the "Pro" plan with an orange border and a "Most Popular" badge.

#### B. App Layout (`/dashboard/*`)

- Desktop: A persistent left sidebar (Dark Navy `bg-[#0F172A]`). Links: Dashboard, Quotations, Packages, Invoices, Deliveries, Postponed, Calendar, Settings, Billing, Team, Help, Log Out. Active link should have a subtle orange background tint and orange text.

- Mobile: Sidebar collapses into a slide-out drawer triggered by a hamburger menu.

- Top Header (App): Studio Logo, "7 Days Left in Trial" badge (orange background, dark text), Notification Bell, Hamburger menu.

- User Profile: Bottom of sidebar. Avatar (initials in orange circle), Name, Email.

#### C. Dashboard Page (`/dashboard`)

- Dark Hero Card: Navy gradient background. Studio name ("Romance"). Subtitle: "Create and manage professional quotations for photography and videography services." Buttons: "+ Create New Quotation" (solid orange), "Create Invoice" (outline white).

- KPI Cards (Grid of 5):

  - Total Quotations: 0 (10 remaining in orange text)

  - Confirmed: 0

  - Invoices: 0 (10 remaining in orange text)

  - Total Collected: Rs. 0 (Orange text)

  - Total Package Value: Rs. 0 (Orange text)

- Event Overview: A unified timeline/list view. Include a search bar, an "+ Add Event" button (teal or navy), and filter chips for event types (Wedding, Pre-shoot, Homecoming, Engagement, Other, Custom Event, Draft, Confirmed).

#### D. Smart Quotation Wizard (`/dashboard/quotations/new`)

Create a 2-step wizard. Use `react-hook-form` to manage the state across steps.

- Progress Bar: "Step 1 of 2" with orange circles.

- Step 1: Event & Client Details

  - Toggle: "Wedding" (active, orange) vs "Other Event".

  - Section: "Bride & Groom Details": Inputs for Bride Name, Groom Name, Primary Phone (required, asterisk), Optional Phone, Email Address.

  - Section: "Wedding Details": Date picker, Shoot Location, Hotel.

  - Section: "Engagement Details": Date picker, Shoot Location, Hotel.

  - Section: "Pre-shoot Sessions": A button "+ Add Pre-shoot". Empty state: "No pre-shoot sessions added. Click 'Add Pre-shoot' above to add one."

  - Sticky Footer: "Next →" button (orange).

- Step 2: Pricing & Packages

  - Left Column (Top on Mobile): "Client Summary" card. Read-only display of data from Step 1. Bride, Groom, Wedding Date, Engagement Date, Shoot Location.

  - Right Column (Bottom on Mobile):

    - "Service Type": Radio buttons (All, Photography, Videography, Both, Engagement, Others).

    - "Select a Package": Dropdown + "+ Add Package" button (orange).

    - "Or add a custom package": Input for name and price.

    - "Extras": Checkboxes for "Drone Shoot" (Aerial photography) and "Transport / Mileage" (with inputs for Total KM and Rate per KM).

    - "Add-ons": Button "+ Add Extra Item".

    - Summary Box (Navy): "Estimated Total: Rs. 0", Input for "Discount (LKR)", Text area for "Special Notes".

  - Sticky Footer: "← Previous" (outline) and "Create Quotation" (solid orange).

#### E. Interactive Calendar (`/dashboard/calendar`)

- View Toggles: Month, Week, List (Orange active state).

- Legend: Color dots for Wedding (Blue), Pre-shoot (Pink), Homecoming (Green), Engagement (Orange), Other (Brown), Custom Event (Teal), Draft (Light Gray), Confirmed (Dark Gray).

- Month View: Standard grid. Highlight today with a light yellow circle.

- Event Details: Clicking a day opens a side panel or modal showing events for that day.

- Postponed Module: A separate tab or section. Shows a list of postponed events. Each item shows "Original Date → New Date" with an orange arrow. Include an "Update New Date" button and "Contact Client" button.

#### F. Invoicing & Financials (`/dashboard/invoices`)

- List view of invoices. Status badges: 'Paid' (Green), 'Pending' (Orange), 'Overdue' (Red).

- "Convert to Invoice" button on confirmed quotations.

- Financial Tracking Page (`/dashboard/finance`):

  - Cards for: Total Income (Rs. 12,480), Total Expenses (Rs. 4,320), Net Profit (Rs. 8,160).

  - Charts: A line chart for Cash Flow (Income vs Expenses). A donut chart for Expense Breakdown (Equipment 38%, Travel 22%, Studio Rent 15%, Marketing 10%, Other 15%).

  - Recent Transactions table.

### 6. SPECIFIC UI/UX INSTRUCTIONS

- Currency: Always format currency as "Rs. X,XXX" (LKR).

- Empty States: Never show a blank screen. Use a subtle icon (like a document outline), a friendly message ("No quotations found."), and a clear CTA ("Create your first quotation →").

- Forms: Inputs should have a light gray background (`bg-slate-50`), no harsh borders, and a slight orange ring on focus (`focus:ring-2 focus:ring-orange-500`).

- Modals/Dialogs: Use Shadcn Dialog for "Add Event" or "Add Package". Ensure they are mobile-friendly (full screen on mobile, centered on desktop).

- Toasts: Use a toast notification system (like Sonner) for success/error messages (e.g., "Quotation created successfully!", "Client saved!").

### 7. DELIVERABLES

Please generate the code for:

1. `tailwind.config.ts` with the custom color palette.

2. The main `layout.tsx` for the dashboard (with responsive sidebar).

3. The Dashboard page (`/dashboard/page.tsx`) with the Hero card and KPI grid.

4. The Quotation Wizard (`/dashboard/quotations/new/page.tsx`) with Step 1 and Step 2 forms.

5. The Interactive Calendar (`/dashboard/calendar/page.tsx`).

Use mock data where necessary so the UI is fully populated and visually impressive out of the box. Ensure all buttons, links, and forms are fully responsive and styled perfectly.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
