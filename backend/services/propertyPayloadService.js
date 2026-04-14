const OBJECTIVES = new Set(["comprar", "arrendar"]);
const PROPERTY_TYPES = new Set(["apartamento", "moradia", "terreno", "loja", "garagem"]);
const STATUSES = new Set(["novo", "usado", "em_construcao", "para_recuperar"]);
const ENERGY_CERTS = new Set(["A", "B", "C", "D", "E", "F", "Isento"]);

function parseBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "sim", "yes", "on"].includes(normalized)) {
      return true;
    }
    if (["0", "false", "nao", "não", "no", "off"].includes(normalized)) {
      return false;
    }
  }

  return fallback;
}

function parseNullableInt(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseRequiredInt(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseNullableDecimal(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseRequiredDecimal(value) {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseJsonArray(value, fallback = []) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (error) {
      return fallback;
    }
  }

  return fallback;
}

function normalizeString(value) {
  return String(value || "").trim();
}

function parseDivisions(value) {
  const rawDivisions = parseJsonArray(value, []);

  return rawDivisions
    .map((division) => ({
      name: normalizeString(division?.name),
      area: parseNullableDecimal(division?.area),
    }))
    .filter((division) => division.name.length > 0);
}

function parseImageIds(value) {
  const ids = parseJsonArray(value, [])
    .map((idValue) => Number.parseInt(idValue, 10))
    .filter((idValue) => Number.isInteger(idValue) && idValue > 0);

  return [...new Set(ids)];
}

function validatePayload(payload, { partial = false } = {}) {
  const errors = [];

  const parsed = {
    title: payload.title !== undefined ? normalizeString(payload.title) : undefined,
    description: payload.description !== undefined ? normalizeString(payload.description) : undefined,
    objective: payload.objective !== undefined ? normalizeString(payload.objective) : undefined,
    propertyType: payload.propertyType !== undefined ? normalizeString(payload.propertyType) : undefined,
    status: payload.status !== undefined ? normalizeString(payload.status) : undefined,
    price: payload.price !== undefined ? parseRequiredDecimal(payload.price) : undefined,
    district: payload.district !== undefined ? normalizeString(payload.district) : undefined,
    county: payload.county !== undefined ? normalizeString(payload.county) : undefined,
    parish: payload.parish !== undefined ? normalizeString(payload.parish) : undefined,
    addressMap: payload.addressMap !== undefined ? normalizeString(payload.addressMap) : undefined,
    latitude: payload.latitude !== undefined ? parseNullableDecimal(payload.latitude) : undefined,
    longitude: payload.longitude !== undefined ? parseNullableDecimal(payload.longitude) : undefined,
    rooms: payload.rooms !== undefined ? parseRequiredInt(payload.rooms) : undefined,
    bathrooms: payload.bathrooms !== undefined ? parseRequiredInt(payload.bathrooms) : undefined,
    usefulArea: payload.usefulArea !== undefined ? parseRequiredDecimal(payload.usefulArea) : undefined,
    grossArea: payload.grossArea !== undefined ? parseRequiredDecimal(payload.grossArea) : undefined,
    privativeGrossArea:
      payload.privativeGrossArea !== undefined
        ? parseRequiredDecimal(payload.privativeGrossArea)
        : undefined,
    lotArea: payload.lotArea !== undefined ? parseNullableDecimal(payload.lotArea) : undefined,
    buildYear: payload.buildYear !== undefined ? parseNullableInt(payload.buildYear) : undefined,
    floor: payload.floor !== undefined ? normalizeString(payload.floor) : undefined,
    elevator: payload.elevator !== undefined ? parseBoolean(payload.elevator, false) : undefined,
    parkingSpaces:
      payload.parkingSpaces !== undefined ? parseRequiredInt(payload.parkingSpaces) : undefined,
    evCharging: payload.evCharging !== undefined ? parseBoolean(payload.evCharging, false) : undefined,
    energyCert: payload.energyCert !== undefined ? normalizeString(payload.energyCert) : undefined,
    ownerId: payload.ownerId !== undefined ? parseNullableInt(payload.ownerId) : undefined,
    agentId: payload.agentId !== undefined ? parseNullableInt(payload.agentId) : undefined,
  };

  const requiredFields = [
    "title",
    "description",
    "objective",
    "propertyType",
    "status",
    "price",
    "district",
    "county",
    "parish",
    "addressMap",
    "rooms",
    "bathrooms",
    "usefulArea",
    "grossArea",
    "privativeGrossArea",
    "parkingSpaces",
    "energyCert",
  ];

  if (!partial) {
    for (const fieldName of requiredFields) {
      if (
        parsed[fieldName] === undefined ||
        parsed[fieldName] === null ||
        parsed[fieldName] === ""
      ) {
        errors.push(`Campo obrigatorio em falta: ${fieldName}`);
      }
    }
  }

  if (parsed.objective !== undefined && !OBJECTIVES.has(parsed.objective)) {
    errors.push("objective invalido.");
  }

  if (parsed.propertyType !== undefined && !PROPERTY_TYPES.has(parsed.propertyType)) {
    errors.push("propertyType invalido.");
  }

  if (parsed.status !== undefined && !STATUSES.has(parsed.status)) {
    errors.push("status invalido.");
  }

  if (parsed.energyCert !== undefined && !ENERGY_CERTS.has(parsed.energyCert)) {
    errors.push("energyCert invalido.");
  }

  const numericFields = [
    ["price", parsed.price],
    ["rooms", parsed.rooms],
    ["bathrooms", parsed.bathrooms],
    ["usefulArea", parsed.usefulArea],
    ["grossArea", parsed.grossArea],
    ["privativeGrossArea", parsed.privativeGrossArea],
    ["parkingSpaces", parsed.parkingSpaces],
  ];

  for (const [fieldName, value] of numericFields) {
    if (value !== undefined && value !== null && Number.isNaN(Number(value))) {
      errors.push(`${fieldName} invalido.`);
    }
  }

  const hasLatitude = parsed.latitude !== undefined && parsed.latitude !== null;
  const hasLongitude = parsed.longitude !== undefined && parsed.longitude !== null;
  if (hasLatitude !== hasLongitude) {
    errors.push("latitude e longitude devem ser indicadas em conjunto.");
  }

  if (hasLatitude && (parsed.latitude < -90 || parsed.latitude > 90)) {
    errors.push("latitude invalida.");
  }

  if (hasLongitude && (parsed.longitude < -180 || parsed.longitude > 180)) {
    errors.push("longitude invalida.");
  }

  return {
    parsed,
    errors,
  };
}

module.exports = {
  parseDivisions,
  parseImageIds,
  parseNullableInt,
  validatePayload,
};
