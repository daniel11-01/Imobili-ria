function sanitizeBaseUrl(baseUrl) {
  return String(baseUrl || "").trim().replace(/\/+$/, "");
}

export function resolveMediaUrl(sourceUrl, backendBaseUrl = "") {
  const source = String(sourceUrl || "").trim();
  if (!source) {
    return "";
  }

  if (/^https?:\/\//i.test(source) || source.startsWith("data:")) {
    return source;
  }

  const base = sanitizeBaseUrl(backendBaseUrl);
  if (!base) {
    return source;
  }

  const normalizedPath = source.startsWith("/") ? source : `/${source}`;
  return `${base}${normalizedPath}`;
}
