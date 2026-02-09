export class HttpError extends Error {
  public status: number;
  public code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function badRequest(message: string, code?: string): HttpError {
  return new HttpError(400, message, code);
}

export function unauthorized(message: string, code?: string): HttpError {
  return new HttpError(401, message, code);
}

export function forbidden(message: string, code?: string): HttpError {
  return new HttpError(403, message, code);
}

export function notFound(message: string, code?: string): HttpError {
  return new HttpError(404, message, code);
}

export function conflict(message: string, code?: string): HttpError {
  return new HttpError(409, message, code);
}

