import httpClient from "./httpClient";

async function listAdminUsers({ role, search, page, pageSize, all } = {}) {
  const params = {};

  if (role) {
    params.role = role;
  }

  if (search) {
    params.search = search;
  }

  if (page !== undefined) {
    params.page = page;
  }

  if (pageSize !== undefined) {
    params.pageSize = pageSize;
  }

  if (all === true) {
    params.all = "true";
  }

  const { data } = await httpClient.get("/admin/users", { params });
  return {
    users: data.users || [],
    pagination: data.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 0 },
  };
}

export { listAdminUsers };
