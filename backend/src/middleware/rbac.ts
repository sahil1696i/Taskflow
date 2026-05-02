import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { forbidden, notFound } from '../lib/errors';
import type { AuthenticatedRequest } from './authenticate';

export interface ProjectRequest extends AuthenticatedRequest {
  projectRole: 'ADMIN' | 'MEMBER';
  projectId: string;
}

export async function requireProjectMember(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });

    if (!membership) {
      // Check if project exists at all
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) {
        return next(notFound('Project not found'));
      }
      return next(forbidden('You are not a member of this project'));
    }

    (req as unknown as ProjectRequest).projectRole = membership.role;
    (req as unknown as ProjectRequest).projectId = projectId;
    next();
  } catch (err) {
    next(err);
  }
}

export async function requireAdmin(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const projectReq = req as unknown as ProjectRequest;
  if (projectReq.projectRole !== 'ADMIN') {
    return next(forbidden('Admin access required'));
  }
  next();
}
