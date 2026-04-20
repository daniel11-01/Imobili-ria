import httpClient from "./httpClient";

function appendIfDefined(formData, key, value) {
  if (value === undefined || value === null || value === "") {
    return;
  }
  formData.append(key, value);
}

function buildPropertyFormData(payload) {
  const formData = new FormData();

  appendIfDefined(formData, "title", payload.title);
  appendIfDefined(formData, "description", payload.description);
  appendIfDefined(formData, "objective", payload.objective);
  appendIfDefined(formData, "propertyType", payload.propertyType);
  appendIfDefined(formData, "status", payload.status);
  appendIfDefined(formData, "price", payload.price);
  appendIfDefined(formData, "district", payload.district);
  appendIfDefined(formData, "county", payload.county);
  appendIfDefined(formData, "parish", payload.parish);
  appendIfDefined(formData, "addressMap", payload.addressMap);
  appendIfDefined(formData, "latitude", payload.latitude);
  appendIfDefined(formData, "longitude", payload.longitude);
  appendIfDefined(formData, "showLocation", payload.showLocation);
  appendIfDefined(formData, "rooms", payload.rooms);
  appendIfDefined(formData, "bathrooms", payload.bathrooms);
  appendIfDefined(formData, "usefulArea", payload.usefulArea);
  appendIfDefined(formData, "grossArea", payload.grossArea);
  appendIfDefined(formData, "privativeGrossArea", payload.privativeGrossArea);
  appendIfDefined(formData, "lotArea", payload.lotArea);
  appendIfDefined(formData, "buildYear", payload.buildYear);
  appendIfDefined(formData, "floor", payload.floor);
  appendIfDefined(formData, "elevator", payload.elevator);
  appendIfDefined(formData, "parkingSpaces", payload.parkingSpaces);
  appendIfDefined(formData, "evCharging", payload.evCharging);
  appendIfDefined(formData, "energyCert", payload.energyCert);
  appendIfDefined(formData, "ownerId", payload.ownerId);
  appendIfDefined(formData, "agentId", payload.agentId);

  if (Array.isArray(payload.divisions) && payload.divisions.length > 0) {
    formData.append("divisions", JSON.stringify(payload.divisions));
  }

  if (Array.isArray(payload.removeImageIds) && payload.removeImageIds.length > 0) {
    formData.append("removeImageIds", JSON.stringify(payload.removeImageIds));
  }

  appendIfDefined(formData, "mainImageId", payload.mainImageId);

  if (Array.isArray(payload.images)) {
    payload.images.forEach((file) => {
      formData.append("images", file);
    });
  }

  return formData;
}

async function listAdminProperties(params = {}) {
  const { data } = await httpClient.get("/admin/properties", { params });
  return {
    properties: data.properties || [],
    pagination: data.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 0 },
  };
}

async function getAdminPropertyById(propertyId) {
  const { data } = await httpClient.get(`/admin/properties/${propertyId}`);
  return data.property;
}

async function createAdminProperty(payload) {
  const formData = buildPropertyFormData(payload);
  const { data } = await httpClient.post("/admin/properties", formData);
  return data.property;
}

async function updateAdminProperty(propertyId, payload) {
  const formData = buildPropertyFormData(payload);
  const { data } = await httpClient.put(`/admin/properties/${propertyId}`, formData);
  return data.property;
}

async function deleteAdminProperty(propertyId) {
  await httpClient.delete(`/admin/properties/${propertyId}`);
}

export {
  listAdminProperties,
  getAdminPropertyById,
  createAdminProperty,
  updateAdminProperty,
  deleteAdminProperty,
};
