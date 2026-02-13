import type { Request, Response, NextFunction } from "express";

export function successResponse(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  res.success = function success<T>(data: T, msg = "success") {
    this.json({ code: 200, data, msg });
  };
  next();
}