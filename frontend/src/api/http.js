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
  const body = contentType.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    const message = body?.msg || body?.error?.message || body?.message || `请求失败 (${res.status})`;
    const code = body?.code ?? body?.error?.code ?? "HTTP_ERROR";
    const err = new Error(message);
    err.code = code;
    err.status = res.status;
    throw err;
  }

  // 统一格式 { code, data, msg }：成功时返回 data，兼容旧调用方
  if (body && typeof body.code === "number" && body.data !== undefined) {
    return body.data;
  }
  return body;
}

