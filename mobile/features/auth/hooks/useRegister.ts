import { useMutation } from "@tanstack/react-query";
import { register } from "../api/authApi";
import type { RegisterPayload } from "../types/Auth";

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => register(payload),
  });
}
