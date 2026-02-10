import { fetchJson } from "./http.js";

/** 获取当前房间（没有则自动创建） */
export function getCurrentRoom(token) {
  return fetchJson("/api/rooms/current", { token });
}

/** 创建房间 */
export function createRoom(token, opts = {}) {
  return fetchJson("/api/rooms", { method: "POST", token, body: opts });
}

/** 获取房间详情 */
export function getRoom(token, roomId) {
  return fetchJson(`/api/rooms/${roomId}`, { token });
}

/** 通过邀请码加入房间 */
export function joinRoom(token, inviteCode) {
  return fetchJson("/api/rooms/join", {
    method: "POST",
    token,
    body: { inviteCode },
  });
}

/** 退出房间 */
export function leaveRoom(token, roomId) {
  return fetchJson(`/api/rooms/${roomId}/leave`, { method: "POST", token });
}

/** 获取邀请信息 */
export function getInvite(token, roomId) {
  return fetchJson(`/api/rooms/${roomId}/invite`, { token });
}
