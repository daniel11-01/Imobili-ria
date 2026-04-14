function normalizeAddressQuery(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function toCoordinateString(value) {
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) {
    return "";
  }

  return numeric.toFixed(6);
}

async function geocodeAddressQuery(rawQuery) {
  const query = normalizeAddressQuery(rawQuery);
  if (!query) {
    throw new Error("Indica uma morada para pesquisar no mapa.");
  }

  const endpoint = new URL("https://nominatim.openstreetmap.org/search");
  endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("format", "jsonv2");
  endpoint.searchParams.set("limit", "1");
  endpoint.searchParams.set("addressdetails", "1");

  const response = await fetch(endpoint.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Falha ao contactar a API de mapas.");
  }

  const results = await response.json();
  if (!Array.isArray(results) || results.length === 0) {
    throw new Error("Não foi possível encontrar essa morada no mapa.");
  }

  const first = results[0] || {};
  const latitude = toCoordinateString(first.lat);
  const longitude = toCoordinateString(first.lon);

  if (!latitude || !longitude) {
    throw new Error("A API de mapas não devolveu coordenadas válidas.");
  }

  return {
    latitude,
    longitude,
    displayName: String(first.display_name || "").trim(),
  };
}

export { geocodeAddressQuery, normalizeAddressQuery };
