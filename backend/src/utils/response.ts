export type SuccessBody<T = unknown> = {
  code: number;
  data: T;
  msg: string;
};

export type ErrorBody = {
  code: number;
  data: null;
  msg: string;
};

export type ApiBody<T = unknown> = SuccessBody<T> | ErrorBody;
