import axios from "axios";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").trim();
const resolvedApiBaseUrl = apiBaseUrl || (import.meta.env.DEV ? "http://localhost:5000/api" : "/api");

const httpClient = axios.create({
  baseURL: resolvedApiBaseUrl,
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default httpClient;
