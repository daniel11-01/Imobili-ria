import httpClient from "./httpClient";

async function register(payload) {
  const { data } = await httpClient.post("/auth/register", payload);
  return data;
}

async function login(payload) {
  const { data } = await httpClient.post("/auth/login", payload);
  return data;
}

async function logout() {
  await httpClient.post("/auth/logout");
}

async function me() {
  const { data } = await httpClient.get("/auth/me");
  return data;
}

async function updateProfile(payload) {
  const { data } = await httpClient.put("/auth/me", payload);
  return data;
}

async function updatePassword(payload) {
  await httpClient.put("/auth/me/password", payload);
}

async function deleteAccount(password) {
  await httpClient.request({
    method: "delete",
    url: "/auth/me",
    data: { password },
  });
}

async function createAdmin(payload) {
  const { data } = await httpClient.post("/admin/users/admin", payload);
  return data;
}

async function forgotPassword(payload) {
  const { data } = await httpClient.post("/auth/forgot-password", payload);
  return data;
}

async function resetPassword(payload) {
  const { data } = await httpClient.post("/auth/reset-password", payload);
  return data;
}

async function getMyPropertyStats() {
  const { data } = await httpClient.get("/auth/me/property-stats");
  return data;
}

export {
  register,
  login,
  logout,
  me,
  updateProfile,
  updatePassword,
  deleteAccount,
  createAdmin,
  forgotPassword,
  resetPassword,
  getMyPropertyStats,
};
