import axios from "axios";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").trim();
const resolvedApiBaseUrl = apiBaseUrl || (import.meta.env.DEV ? "http://localhost:5000/api" : "/api");
const csrfHeaderName = (import.meta.env.VITE_CSRF_HEADER_NAME || "x-csrf-token").trim().toLowerCase() || "x-csrf-token";

let csrfTokenCache = "";
let csrfBootstrapPromise = null;

function isMutatingMethod(method) {
  const normalized = String(method || "").toLowerCase();
  return ["post", "put", "patch", "delete"].includes(normalized);
}

async function fetchCsrfToken() {
  if (typeof fetch === "undefined") {
    return "";
  }

  const response = await fetch(`${resolvedApiBaseUrl}/auth/csrf-token`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    return "";
  }

  const payload = await response.json().catch(() => ({}));
  const token = String(payload?.csrfToken || "").trim();

  if (token) {
    csrfTokenCache = token;
  }

  return csrfTokenCache;
}

async function ensureCsrfToken() {
  if (csrfTokenCache) {
    return csrfTokenCache;
  }

  if (!csrfBootstrapPromise) {
    csrfBootstrapPromise = fetchCsrfToken().finally(() => {
      csrfBootstrapPromise = null;
    });
  }

  return csrfBootstrapPromise;
}

const httpClient = axios.create({
  baseURL: resolvedApiBaseUrl,
  timeout: 10000,
  withCredentials: true,
});

httpClient.interceptors.request.use(async (config) => {
  if (isMutatingMethod(config.method)) {
    const csrfToken = await ensureCsrfToken();

    if (csrfToken) {
      if (config.headers?.set) {
        config.headers.set(csrfHeaderName, csrfToken);
      } else {
        config.headers = config.headers || {};
        config.headers[csrfHeaderName] = csrfToken;
      }
    }
  }

  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    if (config.headers?.delete) {
      config.headers.delete("Content-Type");
    } else if (config.headers) {
      delete config.headers["Content-Type"];
    }
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const message = String(error?.response?.data?.message || "").toLowerCase();
    const originalRequest = error?.config;

    if (
      status === 403 &&
      message.includes("csrf") &&
      originalRequest &&
      !originalRequest._csrfRetry
    ) {
      originalRequest._csrfRetry = true;
      csrfTokenCache = "";
      const refreshedToken = await ensureCsrfToken();

      if (refreshedToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers[csrfHeaderName] = refreshedToken;
      }

      return httpClient.request(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default httpClient;
