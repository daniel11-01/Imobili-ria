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
  const hasAvatarFile = Boolean(payload?.avatarFile);
  const shouldUseMultipart = hasAvatarFile || payload?.removeAvatar === true;

  if (!shouldUseMultipart) {
    const { data } = await httpClient.put("/auth/me", payload);
    return data;
  }

  const formData = new FormData();
  formData.append("firstName", payload.firstName || "");
  formData.append("lastName", payload.lastName || "");
  formData.append("email", payload.email || "");

  if (payload.publicPhone !== undefined) {
    formData.append("publicPhone", payload.publicPhone || "");
  }

  if (payload.licenseNumber !== undefined) {
    formData.append("licenseNumber", payload.licenseNumber || "");
  }

  if (payload.removeAvatar === true) {
    formData.append("removeAvatar", "true");
  }

  if (hasAvatarFile) {
    formData.append("avatar", payload.avatarFile);
  }

  const { data } = await httpClient.put("/auth/me", formData);
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

async function createStaff(payload) {
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
  createStaff,
  forgotPassword,
  resetPassword,
  getMyPropertyStats,
};
