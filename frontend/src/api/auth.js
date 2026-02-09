import { fetchJson } from "./http.js";

export function register({ phone, password }) {
  return fetchJson("/api/auth/register", {
    method: "POST",
    body: { phone, password }
  });
}

export function login({ phone, password }) {
  return fetchJson("/api/auth/login", {
    method: "POST",
    body: { phone, password }
  });
}

export function me(token) {
  return fetchJson("/api/auth/me", { token });
}

