import jwt from "jsonwebtoken";
import type { StringValue } from "ms";
import { env } from "../config/env";

export type JwtPayload = {
  sub: string; // userId
  phone: string;
  ver: number; // tokenVersion，用于唯一性登录校验
};

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as StringValue,
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded !== "object" || decoded === null) {
    throw new Error("Invalid token payload");
  }

  const sub = (decoded as any).sub;
  const phone = (decoded as any).phone;
  const ver = (decoded as any).ver;
  if (typeof sub !== "string" || typeof phone !== "string" || typeof ver !== "number") {
    throw new Error("Invalid token payload");
  }
  return { sub, phone, ver };
}
