
import axios from "axios";
import { Platform } from "react-native";
import { getAuthToken } from "./tokenStorage";

export function getApiBaseUrl(): string {
  if (Platform.OS === "web") {
    return "/api";
  }

  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "");

  if (!baseUrl) {
    throw new Error("Configure EXPO_PUBLIC_API_URL para conectar à API Laravel.");
  }

  if (!/\/api$/i.test(baseUrl)) {
    throw new Error("EXPO_PUBLIC_API_URL deve terminar com /api.");
  }

  return baseUrl;
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 10000,
  withCredentials: Platform.OS === "web",
  withXSRFToken: Platform.OS === "web",
});

api.interceptors.request.use(async (config) => {
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    config.headers.delete("Content-Type");
  }

  if (Platform.OS !== "web") {
    const token = await getAuthToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export default api;
