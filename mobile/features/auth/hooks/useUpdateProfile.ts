import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAuthenticatedUser } from "../api/authApi";
import type { AuthUser, UpdateProfilePayload } from "../types/Auth";

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      updateAuthenticatedUser(payload),
    onSuccess: (user: AuthUser) => {
      queryClient.setQueryData<AuthUser>(["auth", "user"], user);
    },
  });
}
