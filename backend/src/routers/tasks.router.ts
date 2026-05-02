import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate';
import { requireProjectMember, requireAdmin, ProjectRequest } from '../middleware/rbac';
import { CreateTaskSchema, UpdateStatusSchema, ReassignTaskSchema } from '../schemas/task.schema';
import { taskService } from '../services/task.service';
import { unprocessable } from '../lib/errors';

export const tasksRouter = Router({ mergeParams: true });

function parseZodError(err: import('zod').ZodError): string[] {
  return err.errors.map((e) => e.path.join('.') || e.message);
}

// GET /api/projects/:projectId/tasks
tasksRouter.get(
  '/',
  authenticate,
  requireProjectMember as unknown as (req: Request, res: Response, next: NextFunction) => void,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, assigneeId } = req.query as { status?: string; assigneeId?: string };
      const filters: { status?: 'TODO' | 'IN_PROGRESS' | 'DONE'; assigneeId?: string } = {};

      if (status) {
        if (!['TODO', 'IN_PROGRESS', 'DONE'].includes(status)) {
          throw unprocessable('Invalid status filter');
        }
        filters.status = status as 'TODO' | 'IN_PROGRESS' | 'DONE';
      }
      if (assigneeId) {
        filters.assigneeId = assigneeId;
      }

      const tasks = await taskService.list(req.params.projectId, filters);
      res.json(tasks);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/projects/:projectId/tasks (Admin only)
tasksRouter.post(
  '/',
  authenticate,
  requireProjectMember as unknown as (req: Request, res: Response, next: NextFunction) => void,
  requireAdmin as unknown as (req: Request, res: Response, next: NextFunction) => void,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = CreateTaskSchema.safeParse(req.body);
      if (!parsed.success) {
        throw unprocessable('Validation failed', parseZodError(parsed.error));
      }
      const task = await taskService.create(req.params.projectId, parsed.data);
      res.status(201).json(task);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/projects/:projectId/tasks/:taskId
tasksRouter.get(
  '/:taskId',
  authenticate,
  requireProjectMember as unknown as (req: Request, res: Response, next: NextFunction) => void,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await taskService.getById(req.params.projectId, req.params.taskId);
      res.json(task);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/projects/:projectId/tasks/:taskId
tasksRouter.patch(
  '/:taskId',
  authenticate,
  requireProjectMember as unknown as (req: Request, res: Response, next: NextFunction) => void,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const projectReq = req as unknown as ProjectRequest;
      const { status, assigneeId } = req.body;

      // If reassigning (assigneeId provided), must be Admin
      if (assigneeId !== undefined) {
        if (projectReq.projectRole !== 'ADMIN') {
          throw unprocessable('Only admins can reassign tasks');
        }
        const parsed = ReassignTaskSchema.safeParse({ assigneeId });
        if (!parsed.success) {
          throw unprocessable('Validation failed', parseZodError(parsed.error));
        }
        const task = await taskService.reassign(
          req.params.taskId,
          parsed.data.assigneeId,
          req.params.projectId
        );
        return res.json(task);
      }

      // Status update
      if (status !== undefined) {
        const parsed = UpdateStatusSchema.safeParse({ status });
        if (!parsed.success) {
          throw unprocessable('Validation failed', parseZodError(parsed.error));
        }
        const task = await taskService.updateStatus(req.params.taskId, parsed.data.status, {
          id: authReq.user.id,
          projectRole: projectReq.projectRole,
        });
        return res.json(task);
      }

      throw unprocessable('No valid fields provided for update');
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/projects/:projectId/tasks/:taskId (Admin only)
tasksRouter.delete(
  '/:taskId',
  authenticate,
  requireProjectMember as unknown as (req: Request, res: Response, next: NextFunction) => void,
  requireAdmin as unknown as (req: Request, res: Response, next: NextFunction) => void,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await taskService.delete(req.params.taskId, req.params.projectId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);
