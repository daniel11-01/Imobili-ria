import axios from "axios";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").trim();
const resolvedApiBaseUrl = apiBaseUrl || (import.meta.env.DEV ? "http://localhost:5000/api" : "/api");

const httpClient = axios.create({
  baseURL: resolvedApiBaseUrl,
  timeout: 10000,
  withCredentials: true,
});

httpClient.interceptors.request.use((config) => {
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    if (config.headers?.delete) {
      config.headers.delete("Content-Type");
    } else if (config.headers) {
      delete config.headers["Content-Type"];
    }
  }

  return config;
});

export default httpClient;
