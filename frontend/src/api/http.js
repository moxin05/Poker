const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

export async function fetchJson(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    const message =
      data?.error?.message || data?.message || `请求失败 (${res.status})`;
    const code = data?.error?.code || "HTTP_ERROR";
    const err = new Error(message);
    err.code = code;
    err.status = res.status;
    throw err;
  }

  return data;
}

