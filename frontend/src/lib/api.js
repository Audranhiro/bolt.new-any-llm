import axios from "axios";

export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

// Attach token from localStorage fallback (for cross-site cookie issues)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("apa_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function formatApiError(err) {
  const d = err?.response?.data?.detail;
  if (d == null) return err?.message || "Erreur inattendue";
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((e) => e?.msg || JSON.stringify(e)).join(" ");
  if (d?.msg) return d.msg;
  return JSON.stringify(d);
}
