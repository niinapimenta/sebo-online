import { useMutation } from "@tanstack/react-query";
import { requestPasswordReset } from "../api/authApi";
import type { ForgotPasswordPayload } from "../types/Auth";

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => requestPasswordReset(payload),
  });
}
