import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "../api/authApi";
import type { AuthUser, LoginPayload } from "../types/Auth";

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: (user: AuthUser) => {
      queryClient.setQueryData(["auth", "user"], user);
    },
  });
}
