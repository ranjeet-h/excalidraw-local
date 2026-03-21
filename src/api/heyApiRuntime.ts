import axios from "axios";
import type { CreateClientConfig } from "./generated/client.gen";
import { createClient } from "./generated/client/client.gen";

const getApiBaseUrl = (): string => {
  if (typeof window === "undefined") return "http://localhost:3001";
  const { protocol } = window.location;
  // Tauri webview uses tauri:// or https://tauri.localhost — always point to local backend
  if (protocol === "tauri:" || protocol === "https:" && window.location.hostname === "tauri.localhost") {
    return "http://localhost:3001";
  }
  // Vite dev server or local preview
  return "http://localhost:3001";
};

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});

export const createClientConfig: CreateClientConfig = (config) => ({
  ...(config ?? {}),
  axios: apiClient,
  baseURL: getApiBaseUrl(),
});

export const client = createClient({
  axios: apiClient,
  baseURL: getApiBaseUrl(),
});
