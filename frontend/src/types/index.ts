export interface Studio {
  id: string;
  name: string;
  subdomain: string;
  logoUrl: string;
  bankDetails: string;
  trialEndsAt: string;
}
export interface Client {
  id: string;
  studioId: string;
  brideName: string;
  groomName: string;
  primaryPhone: string;
  optionalPhone?: string;
  email: string;
  address: string;
}
export interface Event {
  id: string;
  clientId: string;
  type: "Wedding" | "Engagement" | "Homecoming" | "Pre-shoot" | "Other";
  date: string;
  location: string;
  hotel: string;
  status: "Draft" | "Confirmed" | "Postponed";
}
export interface Package {
  id: string;
  name: string;
  price: number;
  serviceType: "Photography" | "Videography" | "Both" | "All";
}
export interface Extra {
  id: string;
  name: string;
  price: number;
  type: "Drone" | "Transport" | "Custom";
}
export interface Quotation {
  id: string;
  eventId: string;
  packages: Package[];
  extras: Extra[];
  subtotal: number;
  discount: number;
  total: number;
  status: "Draft" | "Sent" | "Accepted";
}
