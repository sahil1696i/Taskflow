import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate';
import { requireProjectMember, requireAdmin, ProjectRequest } from '../middleware/rbac';
import { CreateProjectSchema, AddMemberSchema } from '../schemas/project.schema';
import { projectService } from '../services/project.service';
import { unprocessable } from '../lib/errors';

export const projectsRouter = Router();

function parseZodError(err: import('zod').ZodError): string[] {
  return err.errors.map((e) => e.path.join('.') || e.message);
}

// GET /api/projects — list projects for current user
projectsRouter.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const projects = await projectService.listForUser(authReq.user.id);
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

// POST /api/projects — create a project
projectsRouter.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const parsed = CreateProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      throw unprocessable('Validation failed', parseZodError(parsed.error));
    }
    const project = await projectService.create(authReq.user.id, parsed.data);
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:projectId — get project details
projectsRouter.get(
  '/:projectId',
  authenticate,
  requireProjectMember as unknown as (req: Request, res: Response, next: NextFunction) => void,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const project = await projectService.getById(req.params.projectId, authReq.user.id);
      res.json(project);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/projects/:projectId — delete project (Admin only)
projectsRouter.delete(
  '/:projectId',
  authenticate,
  requireProjectMember as unknown as (req: Request, res: Response, next: NextFunction) => void,
  requireAdmin as unknown as (req: Request, res: Response, next: NextFunction) => void,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await projectService.delete(req.params.projectId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/projects/:projectId/members — add member (Admin only)
projectsRouter.post(
  '/:projectId/members',
  authenticate,
  requireProjectMember as unknown as (req: Request, res: Response, next: NextFunction) => void,
  requireAdmin as unknown as (req: Request, res: Response, next: NextFunction) => void,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = AddMemberSchema.safeParse(req.body);
      if (!parsed.success) {
        throw unprocessable('Validation failed', parseZodError(parsed.error));
      }
      const members = await projectService.addMember(req.params.projectId, parsed.data.email);
      res.status(201).json(members);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/projects/:projectId/members/:userId — remove member (Admin only)
projectsRouter.delete(
  '/:projectId/members/:userId',
  authenticate,
  requireProjectMember as unknown as (req: Request, res: Response, next: NextFunction) => void,
  requireAdmin as unknown as (req: Request, res: Response, next: NextFunction) => void,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      await projectService.removeMember(
        req.params.projectId,
        req.params.userId,
        authReq.user.id
      );
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);
