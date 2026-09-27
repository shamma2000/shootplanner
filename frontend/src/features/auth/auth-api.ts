import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

export type AuthUser = {
  id: string;
  studio_id: string;
  studio_name: string;
  subdomain: string;
  name: string;
  email: string;
  phone: string;
  role: string;
};

export type RegisterPayload = {
  studio_name: string;
  subdomain: string;
  name: string;
  email: string;
  phone: string;
  password: string;
};

export const currentUserQuery = queryOptions({
  queryKey: ["auth", "me"],
  queryFn: () => apiRequest<AuthUser>("/auth/me"),
  retry: false,
  staleTime: 60_000,
});

export function login(email: string, password: string, rememberMe: boolean) {
  return apiRequest<AuthUser>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, remember_me: rememberMe }),
  });
}

export function register(payload: RegisterPayload) {
  return apiRequest<AuthUser>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logout() {
  return apiRequest<void>("/auth/logout", { method: "POST" });
}
