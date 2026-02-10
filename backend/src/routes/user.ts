import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { requireAuth } from "../middleware/auth";
import { UserModel } from "../models/User";
import { badRequest } from "../utils/httpErrors";

export const userRouter = Router();
userRouter.use(requireAuth);

/* ------------------------------------------------
   头像上传目录
   ------------------------------------------------ */
const AVATAR_DIR = path.resolve(__dirname, "../../uploads/avatars");

// 确保目录存在
if (!fs.existsSync(AVATAR_DIR)) {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
}

/* ------------------------------------------------
   Multer 配置 — 内存缓冲，后面用 sharp 压缩
   ------------------------------------------------ */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("仅支持 jpg/png/webp/gif 格式") as any, false);
    }
  },
});

/* ------------------------------------------------
   POST /api/user/avatar — 上传头像
   ------------------------------------------------ */
userRouter.post("/avatar", upload.single("avatar"), async (req, res, next) => {
  try {
    if (!req.file) throw badRequest("请选择图片文件", "NO_FILE");

    const { userId } = req.auth!;
    const filename = `${userId}.webp`;
    const filepath = path.join(AVATAR_DIR, filename);

    // 用 sharp 压缩为 webp，限制尺寸 256x256
    await sharp(req.file.buffer)
      .resize(256, 256, { fit: "cover" })
      .webp({ quality: 75 })
      .toFile(filepath);

    const avatarUrl = `/uploads/avatars/${filename}`;

    await UserModel.findByIdAndUpdate(userId, { avatar: avatarUrl });

    res.json({ avatar: avatarUrl });
  } catch (e) {
    next(e);
  }
});

/* ------------------------------------------------
   GET /api/user/profile — 获取个人信息
   ------------------------------------------------ */
userRouter.get("/profile", async (req, res, next) => {
  try {
    const { userId } = req.auth!;
    const user = await UserModel.findById(userId).lean();
    if (!user) throw badRequest("用户不存在", "USER_NOT_FOUND");

    res.json({
      user: {
        id: user._id.toString(),
        phone: user.phone,
        avatar: user.avatar || "",
      },
    });
  } catch (e) {
    next(e);
  }
});
