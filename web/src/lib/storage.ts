// Storage helpers for Liber Speech
import type { BackendConfig } from "./types";

const STORAGE_KEY = "liber-speech-config";

export function loadConfig(): BackendConfig {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }
  return {
    baseUrl: "http://localhost:5555",
    apiPrefix: "/api/v1", 
    token: "",
  };
}

export function saveConfig(cfg: BackendConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}
