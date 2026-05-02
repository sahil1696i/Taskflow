import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { unauthorized } from '../lib/errors';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

interface JwtPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(unauthorized('Authentication required'));
  }

  const token = authHeader.slice(7);

  try {
    const secret = process.env.JWT_SECRET!;
    const payload = jwt.verify(token, secret) as JwtPayload;

    (req as AuthenticatedRequest).user = {
      id: payload.sub,
      email: payload.email,
    };

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(unauthorized('Token has expired', 'TOKEN_EXPIRED'));
    }
    return next(unauthorized('Invalid token'));
  }
}
