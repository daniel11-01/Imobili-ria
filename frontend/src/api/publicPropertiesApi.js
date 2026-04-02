import httpClient from "./httpClient";

async function listPublicProperties(params = {}) {
  const { data } = await httpClient.get("/properties", { params });
  return data;
}

async function getPublicProperty(propertyId) {
  const { data } = await httpClient.get(`/properties/${propertyId}`);
  return data;
}

async function sendPropertyContact(propertyId, payload) {
  const { data } = await httpClient.post(`/properties/${propertyId}/contact`, payload);
  return data;
}

export { listPublicProperties, getPublicProperty, sendPropertyContact };
