import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import * as ErrorConstants from "../constants/errorConstants";
import { UserModel } from "../models/User";
import { unauthorized } from "../utils/httpErrors";
import { verifyAccessToken } from "../utils/jwt";

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header) return next(unauthorized(ErrorConstants.AUTH_MISSING_HEADER));

  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) {
    return next(unauthorized(ErrorConstants.AUTH_HEADER_FORMAT));
  }

  try {
    const payload = verifyAccessToken(token);
    if (!mongoose.isValidObjectId(payload.sub)) {
      return next(unauthorized(ErrorConstants.AUTH_INVALID_TOKEN));
    }

    const user = await UserModel.findById(payload.sub).lean();
    if (!user) return next(unauthorized(ErrorConstants.AUTH_USER_NOT_FOUND));

    if (payload.ver !== (user.tokenVersion ?? 0)) {
      return next(unauthorized(ErrorConstants.AUTH_LOGIN_EXPIRED));
    }

    req.auth = { userId: payload.sub, phone: user.phone };
    next();
  } catch {
    next(unauthorized(ErrorConstants.AUTH_VERIFY_FAILED));
  }
}
