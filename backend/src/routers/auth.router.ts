import { Router, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { RegisterSchema, LoginSchema } from '../schemas/auth.schema';
import { authService } from '../services/auth.service';
import { unprocessable } from '../lib/errors';

export const authRouter = Router();

function parseZodError(err: ZodError): string[] {
  return err.errors.map((e) => e.path.join('.') || e.message);
}

authRouter.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      throw unprocessable('Validation failed', parseZodError(parsed.error));
    }
    const result = await authService.register(parsed.data);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw unprocessable('Validation failed', parseZodError(parsed.error));
    }
    const result = await authService.login(parsed.data);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
