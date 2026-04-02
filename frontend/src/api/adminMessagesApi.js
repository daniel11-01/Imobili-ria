import httpClient from "./httpClient";

async function listAdminMessages(params = {}) {
  const { data } = await httpClient.get("/admin/messages", { params });
  return data;
}

async function updateAdminMessageReadStatus(messageId, isRead) {
  const { data } = await httpClient.patch(`/admin/messages/${messageId}/read`, { isRead });
  return data.message;
}

export { listAdminMessages, updateAdminMessageReadStatus };
