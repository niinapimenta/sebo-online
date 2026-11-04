import { z } from "zod";

export const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe seu e-mail.")
    .email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
});

export const RegisterSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Informe seu nome.")
      .max(255, "O nome deve ter até 255 caracteres."),
    email: z
      .string()
      .trim()
      .min(1, "Informe seu e-mail.")
      .email("Informe um e-mail válido.")
      .max(255, "O e-mail deve ter até 255 caracteres."),
    password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres."),
    password_confirmation: z
      .string()
      .min(1, "Confirme sua senha."),
  })
  .refine((values) => values.password === values.password_confirmation, {
    path: ["password_confirmation"],
    message: "A confirmação deve ser igual à senha.",
  });

export const ProfileUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe seu nome.")
    .max(255, "O nome deve ter até 255 caracteres."),
  email: z
    .string()
    .trim()
    .min(1, "Informe seu e-mail.")
    .email("Informe um e-mail válido.")
    .max(255, "O e-mail deve ter até 255 caracteres."),
});

export type LoginFormValues = z.input<typeof LoginSchema>;
export type LoginFormData = z.output<typeof LoginSchema>;
export type RegisterFormValues = z.input<typeof RegisterSchema>;
export type RegisterFormData = z.output<typeof RegisterSchema>;
export type ProfileUpdateFormValues = z.input<typeof ProfileUpdateSchema>;
export type ProfileUpdateData = z.output<typeof ProfileUpdateSchema>;
