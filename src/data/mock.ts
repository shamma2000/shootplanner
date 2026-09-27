import type { Event, Package, Quotation } from "@/types";

export const formatLkr = (value: number) => `Rs. ${value.toLocaleString("en-LK")}`;

const signaturePackage: Package = {
  id: "pkg-1",
  name: "Signature Wedding Story",
  price: 185000,
  serviceType: "Both",
};
const classicPackage: Package = {
  id: "pkg-2",
  name: "Classic Photography",
  price: 95000,
  serviceType: "Photography",
};
const cinematicPackage: Package = {
  id: "pkg-3",
  name: "Cinematic Film",
  price: 125000,
  serviceType: "Videography",
};
export const packages: Package[] = [signaturePackage, classicPackage, cinematicPackage];

export const events: Event[] = [
  {
    id: "evt-1",
    clientId: "cli-1",
    type: "Wedding",
    date: "2026-09-25",
    location: "Colombo",
    hotel: "Galle Face Hotel",
    status: "Confirmed",
  },
  {
    id: "evt-2",
    clientId: "cli-2",
    type: "Pre-shoot",
    date: "2026-09-28",
    location: "Galle Fort",
    hotel: "The Fort Bazaar",
    status: "Draft",
  },
  {
    id: "evt-3",
    clientId: "cli-3",
    type: "Engagement",
    date: "2026-10-03",
    location: "Kandy",
    hotel: "Earl’s Regency",
    status: "Confirmed",
  },
];

export const quotations: Quotation[] = [
  {
    id: "QT-2026-014",
    eventId: "evt-1",
    packages: [signaturePackage],
    extras: [],
    subtotal: 185000,
    discount: 5000,
    total: 180000,
    status: "Accepted",
  },
  {
    id: "QT-2026-015",
    eventId: "evt-2",
    packages: [classicPackage],
    extras: [],
    subtotal: 95000,
    discount: 0,
    total: 95000,
    status: "Sent",
  },
  {
    id: "QT-2026-016",
    eventId: "evt-3",
    packages: [cinematicPackage],
    extras: [],
    subtotal: 125000,
    discount: 0,
    total: 125000,
    status: "Draft",
  },
];
