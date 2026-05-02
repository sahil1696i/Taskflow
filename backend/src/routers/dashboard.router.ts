import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate';
import { requireProjectMember } from '../middleware/rbac';
import { dashboardService } from '../services/dashboard.service';

export const dashboardRouter = Router();

// GET /api/dashboard/me — personal dashboard
dashboardRouter.get(
  '/me',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const summary = await dashboardService.getPersonalSummary(authReq.user.id);
      res.json(summary);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/dashboard/projects/:projectId — project dashboard
dashboardRouter.get(
  '/projects/:projectId',
  authenticate,
  requireProjectMember as unknown as (req: Request, res: Response, next: NextFunction) => void,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await dashboardService.getProjectSummary(req.params.projectId);
      res.json(summary);
    } catch (err) {
      next(err);
    }
  }
);
