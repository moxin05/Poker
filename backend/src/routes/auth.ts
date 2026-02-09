import { Router } from "express";
import { z } from "zod";
import { UserModel } from "../models/User";
import { requireAuth } from "../middleware/auth";
import { conflict, unauthorized } from "../utils/httpErrors";
import { signAccessToken } from "../utils/jwt";
import { hashPassword, verifyPassword } from "../utils/password";

const PhoneSchema = z
  .string()
  .trim()
  .regex(/^\d{6,20}$/, "手机号格式不正确");

const PasswordSchema = z.string().min(6, "密码至少 6 位").max(72);

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
    if (exists) throw conflict("手机号已注册", "PHONE_EXISTS");

    const passwordHash = await hashPassword(password);
    const user = await UserModel.create({ phone, passwordHash });

    const token = signAccessToken({ sub: user._id.toString(), phone: user.phone });
    res.json({ token, user: { id: user._id.toString(), phone: user.phone } });
  } catch (e) {
    next(e);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const { phone, password } = LoginSchema.parse(req.body);

    const user = await UserModel.findOne({ phone });
    if (!user) throw unauthorized("手机号或密码错误", "BAD_CREDENTIALS");

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) throw unauthorized("手机号或密码错误", "BAD_CREDENTIALS");

    const token = signAccessToken({ sub: user._id.toString(), phone: user.phone });
    res.json({ token, user: { id: user._id.toString(), phone: user.phone } });
  } catch (e) {
    next(e);
  }
});

authRouter.get("/me", requireAuth, async (req, res) => {
  res.json({ user: { id: req.auth!.userId, phone: req.auth!.phone } });
});

