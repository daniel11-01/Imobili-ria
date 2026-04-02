export function getBackendBaseUrl() {
  const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").trim();
  return apiBase.replace(/\/api\/?$/, "");
}