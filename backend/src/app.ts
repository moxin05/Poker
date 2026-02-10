import express from "express";
import cors from "cors";
import path from "path";
import { env } from "./config/env";
import { authRouter } from "./routes/auth";
import { roomRouter } from "./routes/room";
import { userRouter } from "./routes/user";
import { errorHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true
    })
  );
  app.use(express.json());

  // 静态文件：头像等上传资源
  app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/rooms", roomRouter);
  app.use("/api/user", userRouter);

  app.use(errorHandler);
  return app;
}

