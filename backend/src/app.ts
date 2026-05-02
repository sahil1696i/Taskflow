import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { AppError } from './lib/errors';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { authRouter } from './routers/auth.router';
import { projectsRouter } from './routers/projects.router';
import { tasksRouter } from './routers/tasks.router';
import { dashboardRouter } from './routers/dashboard.router';

export function createApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/projects', projectsRouter);
  app.use('/api/projects/:projectId/tasks', tasksRouter);
  app.use('/api/dashboard', dashboardRouter);

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Global error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        error: {
          code: err.code,
          message: err.message,
          ...(err.fields && { fields: err.fields }),
        },
      });
    }

    // Prisma unique constraint violation → 409
    if (
      err instanceof PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      return res.status(409).json({
        error: { code: 'CONFLICT', message: 'Resource already exists' },
      });
    }

    console.error('[unhandled error]', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  });

  // Serve frontend static assets in production (after API routes and error handler)
  if (process.env.NODE_ENV === 'production') {
    const frontendDist = path.join(__dirname, '../../frontend/dist');
    app.use(express.static(frontendDist));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }

  return app;
}
