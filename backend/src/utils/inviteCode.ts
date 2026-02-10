import { RoomModel } from "../models/Room";

/**
 * 生成 6 位大写字母数字邀请码，保证唯一
 */
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 去掉 I/O/0/1 避免混淆

function randomCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export async function generateUniqueInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomCode();
    const exists = await RoomModel.exists({ inviteCode: code });
    if (!exists) return code;
  }
  // 极端情况：10 次都冲突，加时间戳后缀
  return randomCode() + Date.now().toString(36).slice(-2).toUpperCase();
}
