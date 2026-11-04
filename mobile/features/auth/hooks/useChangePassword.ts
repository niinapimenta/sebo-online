import { useMutation } from "@tanstack/react-query";
import { changePassword } from "../api/authApi";
import type { ChangePasswordPayload } from "../types/Auth";

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => changePassword(payload),
  });
}
