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

export const ChangePasswordSchema = z.object({
  current_password: z.string().min(1, "Informe sua senha atual."),
  password: z.string().min(8, "A nova senha deve ter pelo menos 8 caracteres."),
  password_confirmation: z.string().min(1, "Confirme sua nova senha."),
}).refine((values) => values.password === values.password_confirmation, {
  path: ["password_confirmation"],
  message: "A confirmação deve ser igual à nova senha.",
}).refine((values) => values.password !== values.current_password, {
  path: ["password"],
  message: "A nova senha deve ser diferente da senha atual.",
});

export const ForgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "Informe seu e-mail.").email("Informe um e-mail válido."),
});

export const ResetPasswordSchema = z.object({
  email: z.string().trim().min(1, "Informe seu e-mail.").email("Informe um e-mail válido."),
  token: z.string().trim().min(1, "O token de recuperação é obrigatório."),
  password: z.string().min(8, "A nova senha deve ter pelo menos 8 caracteres."),
  password_confirmation: z.string().min(1, "Confirme sua nova senha."),
}).refine((values) => values.password === values.password_confirmation, {
  path: ["password_confirmation"],
  message: "A confirmação deve ser igual à nova senha.",
});

export type LoginFormValues = z.input<typeof LoginSchema>;
export type LoginFormData = z.output<typeof LoginSchema>;
export type RegisterFormValues = z.input<typeof RegisterSchema>;
export type RegisterFormData = z.output<typeof RegisterSchema>;
export type ProfileUpdateFormValues = z.input<typeof ProfileUpdateSchema>;
export type ProfileUpdateData = z.output<typeof ProfileUpdateSchema>;
export type ChangePasswordFormValues = z.input<typeof ChangePasswordSchema>;
export type ChangePasswordFormData = z.output<typeof ChangePasswordSchema>;
export type ForgotPasswordFormValues = z.input<typeof ForgotPasswordSchema>;
export type ForgotPasswordFormData = z.output<typeof ForgotPasswordSchema>;
export type ResetPasswordFormValues = z.input<typeof ResetPasswordSchema>;
export type ResetPasswordFormData = z.output<typeof ResetPasswordSchema>;
