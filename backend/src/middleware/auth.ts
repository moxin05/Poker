import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { UserModel } from "../models/User";
import { unauthorized } from "../utils/httpErrors";
import { verifyAccessToken } from "../utils/jwt";

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header) return next(unauthorized("缺少 Authorization", "NO_AUTH_HEADER"));

  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) {
    return next(unauthorized("Authorization 格式错误", "BAD_AUTH_HEADER"));
  }

  try {
    const payload = verifyAccessToken(token);
    if (!mongoose.isValidObjectId(payload.sub)) {
      return next(unauthorized("无效令牌", "INVALID_TOKEN"));
    }

    const user = await UserModel.findById(payload.sub).lean();
    if (!user) return next(unauthorized("用户不存在", "USER_NOT_FOUND"));

    // 唯一性登录校验：token 版本必须匹配
    if (payload.ver !== (user.tokenVersion ?? 0)) {
      return next(unauthorized("登录已失效，请重新登录", "TOKEN_EXPIRED"));
    }

    req.auth = { userId: payload.sub, phone: user.phone };
    next();
  } catch {
    next(unauthorized("令牌校验失败", "INVALID_TOKEN"));
  }
}
