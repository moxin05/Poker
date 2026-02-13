import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/httpErrors";
import * as ErrorConstants from "../constants/errorConstants"

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      code: err.status,
      data: null,
      msg: err.message
    });
    return;
  }

  // zod errors
  if (typeof err === "object" && err && (err as any).name === "ZodError") {
    res.status(400).json({
      code: 400,
      data: null,
      msg: ErrorConstants.PARAM_ERROR
    });
    return;
  }

  res.status(500).json({
    code: 500,
    data: null,
    msg: ErrorConstants.SERVER_ERROR
  });
}

