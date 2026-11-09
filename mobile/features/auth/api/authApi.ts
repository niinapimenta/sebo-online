import axios from "axios";
import { Platform } from "react-native";
import api, { getApiBaseUrl } from "@/services/api";
import { getAuthToken, removeAuthToken, setAuthToken } from "@/services/tokenStorage";
import type {
  ApiData,
  ApiMessage,
  AuthUser,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginPayload,
  MobileLoginResponse,
  RegisterPayload,
  ResetPasswordPayload,
  UpdateProfilePayload,
} from "../types/Auth";

function getLaravelRootUrl(): string {
  const baseUrl = getApiBaseUrl().trim().replace(/\/+$/, "");

  if (!/\/api$/i.test(baseUrl)) {
    throw new Error("A URL da API deve terminar com /api.");
  }

  return baseUrl.replace(/\/api$/i, "");
}

const webSessionApi = axios.create({
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  timeout: 10000,
  withCredentials: true,
  withXSRFToken: true,
});

async function initializeWebCsrf(): Promise<void> {
  await webSessionApi.get(`${getLaravelRootUrl()}/sanctum/csrf-cookie`);
}

export async function register(payload: RegisterPayload): Promise<AuthUser> {
  if (Platform.OS === "web") {
    await initializeWebCsrf();
  }

  const response =
    Platform.OS === "web"
      ? await webSessionApi.post<ApiData<AuthUser>>(
          `${getLaravelRootUrl()}/api/register`,
          payload,
        )
      : await api.post<ApiData<AuthUser>>("/register", payload);

  return response.data.data;
}

export async function login(payload: LoginPayload): Promise<AuthUser> {
  if (Platform.OS === "web") {
    await initializeWebCsrf();

    const response = await webSessionApi.post<ApiData<AuthUser>>(
      `${getLaravelRootUrl()}/login`,
      payload,
    );

    return response.data.data;
  }

  const deviceName = Platform.OS === "ios" ? "Traça iOS" : "Traça Android";
  const response = await api.post<ApiData<MobileLoginResponse>>("/login", {
    ...payload,
    device_name: deviceName,
  });

  await setAuthToken(response.data.data.token);

  return response.data.data.user;
}

export async function logout(): Promise<void> {
  if (Platform.OS === "web") {
    await initializeWebCsrf();
    await webSessionApi.post(`${getLaravelRootUrl()}/logout`);
    return;
  }

  await api.post("/logout");
  await removeAuthToken();
}

export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  if (Platform.OS !== "web" && !(await getAuthToken())) {
    return null;
  }

  try {
    const response =
      Platform.OS === "web"
        ? await webSessionApi.get<ApiData<AuthUser>>(`${getApiBaseUrl()}/user`)
        : await api.get<ApiData<AuthUser>>("/user");

    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      if (Platform.OS !== "web") {
        try {
          await removeAuthToken();
        } catch {
          // A resposta do servidor já confirmou que o token não é válido.
        }
      }

      return null;
    }

    throw error;
  }
}

export async function updateAuthenticatedUser(
  payload: UpdateProfilePayload,
): Promise<AuthUser> {
  if (Platform.OS === "web") {
    await initializeWebCsrf();
  }

  const response =
    Platform.OS === "web"
      ? await webSessionApi.patch<ApiData<AuthUser>>(
          `${getApiBaseUrl()}/user`,
          payload,
        )
      : await api.patch<ApiData<AuthUser>>("/user", payload);

  return response.data.data;
}

export async function changePassword(payload: ChangePasswordPayload): Promise<string> {
  if (Platform.OS === "web") {
    await initializeWebCsrf();
    const response = await webSessionApi.patch<ApiMessage>(`${getApiBaseUrl()}/password`, payload);
    return response.data.message;
  }

  const response = await api.patch<ApiMessage>("/password", payload);
  return response.data.message;
}

export async function requestPasswordReset(payload: ForgotPasswordPayload): Promise<string> {
  if (Platform.OS === "web") {
    await initializeWebCsrf();
    const response = await webSessionApi.post<ApiMessage>(`${getApiBaseUrl()}/forgot-password`, payload);
    return response.data.message;
  }

  const response = await api.post<ApiMessage>("/forgot-password", payload);
  return response.data.message;
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<string> {
  if (Platform.OS === "web") {
    await initializeWebCsrf();
    const response = await webSessionApi.post<ApiMessage>(`${getApiBaseUrl()}/reset-password`, payload);
    return response.data.message;
  }

  const response = await api.post<ApiMessage>("/reset-password", payload);
  return response.data.message;
}
