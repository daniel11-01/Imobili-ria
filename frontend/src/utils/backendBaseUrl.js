export function getBackendBaseUrl() {
  const apiBase = (import.meta.env.VITE_API_BASE_URL || "").trim();

  if (apiBase) {
    return apiBase.replace(/\/api\/?$/, "");
  }

  if (import.meta.env.DEV) {
    return "http://localhost:5000";
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return "";
}