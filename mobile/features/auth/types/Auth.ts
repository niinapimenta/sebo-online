export type AuthUser = {
  id: number;
  name: string;
  email: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type UpdateProfilePayload = Pick<AuthUser, "name" | "email">;

export type ChangePasswordPayload = {
  current_password: string;
  password: string;
  password_confirmation: string;
};

export type ForgotPasswordPayload = { email: string };

export type ResetPasswordPayload = {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
};

export type ApiMessage = { message: string };

export type ApiData<T> = {
  data: T;
};

export type MobileLoginResponse = {
  token: string;
  token_type: "Bearer";
  expires_at: string;
  user: AuthUser;
};
