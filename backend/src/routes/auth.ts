import { Router } from "express";
import { z } from "zod";
import { UserModel } from "../models/User";
import { requireAuth } from "../middleware/auth";
import { conflict, unauthorized } from "../utils/httpErrors";
import { signAccessToken } from "../utils/jwt";
import { hashPassword, verifyPassword } from "../utils/password";
import * as ErrorConstants from "../constants/errorConstants"

const PhoneSchema = z
  .string()
  .trim()
  .regex(/\d{11}$/, ErrorConstants.PHONE_NUMBER_FORMAT);

const PasswordSchema = z.string().min(6, ErrorConstants.PASSWORD_FORMAT).max(20);

const RegisterSchema = z.object({
  phone: PhoneSchema,
  password: PasswordSchema
});

const LoginSchema = z.object({
  phone: PhoneSchema,
  password: PasswordSchema
});

export const authRouter = Router();

authRouter.post("/register", async (req, res, next) => {
  try {
    const { phone, password } = RegisterSchema.parse(req.body);

    const exists = await UserModel.exists({ phone });
    if (exists) throw conflict(ErrorConstants.PHONE_HAS_USED);

    const passwordHash = await hashPassword(password);
    const user = await UserModel.create({ phone, passwordHash, tokenVersion: 0 });

    const token = signAccessToken({ sub: user._id.toString(), phone: user.phone, ver: 0 });
    res.success({ token, user: { id: user._id.toString(), phone: user.phone, avatar: "" } });
  } catch (e) {
    next(e);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const { phone, password } = LoginSchema.parse(req.body);

    const user = await UserModel.findOne({ phone });
    if (!user) throw unauthorized(ErrorConstants.ACCOUNT_INFORMATION_ERROR);

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) throw unauthorized(ErrorConstants.ACCOUNT_INFORMATION_ERROR);

    const newVer = (user.tokenVersion ?? 0) + 1;
    await UserModel.updateOne({ _id: user._id }, { tokenVersion: newVer });

    const token = signAccessToken({ sub: user._id.toString(), phone: user.phone, ver: newVer });
    res.success({ token, user: { id: user._id.toString(), phone: user.phone, avatar: user.avatar || "" } });
  } catch (e) {
    next(e);
  }
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await UserModel.findById(req.auth!.userId).lean();
  res.success({ user: { id: req.auth!.userId, phone: req.auth!.phone, avatar: user?.avatar || "" } });
});

