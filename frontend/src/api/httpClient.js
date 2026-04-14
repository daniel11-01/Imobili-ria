import axios from "axios";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").trim();
const resolvedApiBaseUrl = apiBaseUrl || (import.meta.env.DEV ? "http://localhost:5000/api" : "/api");
const csrfCookieName = (import.meta.env.VITE_CSRF_COOKIE_NAME || "imobiliaria_csrf").trim() || "imobiliaria_csrf";
const csrfHeaderName = (import.meta.env.VITE_CSRF_HEADER_NAME || "x-csrf-token").trim().toLowerCase() || "x-csrf-token";

let csrfBootstrapPromise = null;

function getCookieValue(cookieName) {
  if (typeof document === "undefined") {
    return "";
  }

  const escapedName = cookieName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(?:^|; )${escapedName}=([^;]*)`);
  const match = document.cookie.match(regex);
  return match ? decodeURIComponent(match[1]) : "";
}

function isMutatingMethod(method) {
  const normalized = String(method || "").toLowerCase();
  return ["post", "put", "patch", "delete"].includes(normalized);
}

async function ensureCsrfToken() {
  const existingToken = getCookieValue(csrfCookieName);
  if (existingToken) {
    return existingToken;
  }

  if (typeof fetch === "undefined") {
    return "";
  }

  if (!csrfBootstrapPromise) {
    csrfBootstrapPromise = fetch(`${resolvedApiBaseUrl}/auth/csrf-token`, {
      method: "GET",
      credentials: "include",
    }).finally(() => {
      csrfBootstrapPromise = null;
    });
  }

  await csrfBootstrapPromise;
  return getCookieValue(csrfCookieName);
}

const httpClient = axios.create({
  baseURL: resolvedApiBaseUrl,
  timeout: 10000,
  withCredentials: true,
});

httpClient.interceptors.request.use(async (config) => {
  if (isMutatingMethod(config.method)) {
    let csrfToken = getCookieValue(csrfCookieName);

    if (!csrfToken) {
      csrfToken = await ensureCsrfToken();
    }

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

export default httpClient;
