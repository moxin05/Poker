declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        phone: string;
      };
    }

    interface Response {
      success<T>(data: T, msg?: string): void;
    }
  }
}

export {};