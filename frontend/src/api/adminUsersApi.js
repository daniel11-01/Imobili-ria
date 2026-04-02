import httpClient from "./httpClient";

async function listAdminUsers({ role, search } = {}) {
  const params = {};

  if (role) {
    params.role = role;
  }

  if (search) {
    params.search = search;
  }

  const { data } = await httpClient.get("/admin/users", { params });
  return data.users || [];
}

export { listAdminUsers };
