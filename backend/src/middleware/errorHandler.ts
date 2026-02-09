import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/httpErrors";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: { message: err.message, code: err.code ?? "HTTP_ERROR" }
    });
    return;
  }

  // zod errors
  if (typeof err === "object" && err && (err as any).name === "ZodError") {
    res.status(400).json({
      error: { message: "参数校验失败", code: "VALIDATION_ERROR" }
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    error: { message: "服务器内部错误", code: "INTERNAL_ERROR" }
  });
}

