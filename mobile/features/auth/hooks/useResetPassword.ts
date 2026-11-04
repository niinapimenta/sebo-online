import { useMutation } from "@tanstack/react-query";
import { resetPassword } from "../api/authApi";
import type { ResetPasswordPayload } from "../types/Auth";

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) => resetPassword(payload),
  });
}
