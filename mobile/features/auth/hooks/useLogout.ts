import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "../api/authApi";
import type { AuthUser } from "../types/Auth";

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData<AuthUser | null>(["auth", "user"], null);
    },
  });
}
