/** 上传头像（multipart/form-data，不用 fetchJson） */
export async function uploadAvatar(token, file) {
  const formData = new FormData();
  formData.append("avatar", file);

  const res = await fetch("/api/user/avatar", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "上传失败");
  }
  return data;
}

/** 获取个人信息 */
export async function getProfile(token) {
  const res = await fetch("/api/user/profile", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "获取失败");
  }
  return data;
}
