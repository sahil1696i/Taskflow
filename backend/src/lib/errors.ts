export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly fields?: string[]
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const notFound = (msg: string) => new AppError(404, 'NOT_FOUND', msg);
export const forbidden = (msg: string) => new AppError(403, 'FORBIDDEN', msg);
export const conflict = (msg: string) => new AppError(409, 'CONFLICT', msg);
export const unprocessable = (msg: string, fields?: string[]) =>
  new AppError(422, 'VALIDATION_ERROR', msg, fields);
export const unauthorized = (msg: string, code = 'UNAUTHORIZED') =>
  new AppError(401, code, msg);
export const badRequest = (msg: string) => new AppError(400, 'BAD_REQUEST', msg);
