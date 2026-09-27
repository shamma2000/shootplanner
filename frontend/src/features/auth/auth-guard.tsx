import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { currentUserQuery } from "@/features/auth/auth-api";

export function AuthGuard({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const {
    data: user,
    isPending,
    isError,
  } = useQuery({
    ...currentUserQuery,
    enabled: typeof window !== "undefined",
  });

  useEffect(() => {
    if (isError) {
      void navigate({ to: "/login", replace: true });
    }
  }, [isError, navigate]);

  if (isPending || isError || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <p className="text-sm font-semibold text-muted-foreground">Loading workspace...</p>
      </div>
    );
  }

  return children;
}
