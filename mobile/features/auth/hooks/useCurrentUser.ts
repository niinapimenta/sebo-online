import { useQuery } from "@tanstack/react-query";
import { getAuthenticatedUser } from "../api/authApi";
import type { AuthUser } from "../types/Auth";

export const authApiConfigurada = Boolean(
  process.env.EXPO_PUBLIC_API_URL?.trim(),
);

export function useCurrentUser() {
  return useQuery<AuthUser | null>({
    queryKey: ["auth", "user"],
    queryFn: getAuthenticatedUser,
    enabled: authApiConfigurada,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
