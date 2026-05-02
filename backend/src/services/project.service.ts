import { prisma } from '../lib/prisma';
import { notFound, conflict, badRequest } from '../lib/errors';
import type { CreateProjectInput } from '../schemas/project.schema';
import type { Prisma, ProjectMember, Project, User } from '@prisma/client';

type PrismaTransactionClient = Prisma.TransactionClient;

type MembershipWithProject = ProjectMember & { project: Project };
type MemberWithUser = ProjectMember & { user: User };

export const projectService = {
  async create(userId: string, data: CreateProjectInput) {
    const result = await prisma.$transaction(async (tx: PrismaTransactionClient) => {
      const project = await tx.project.create({
        data: {
          name: data.name,
          description: data.description,
        },
      });

      await tx.projectMember.create({
        data: {
          projectId: project.id,
          userId,
          role: 'ADMIN',
        },
      });

      return project;
    });

    return {
      id: result.id,
      name: result.name,
      description: result.description,
      role: 'ADMIN' as const,
      createdAt: result.createdAt.toISOString(),
    };
  },

  async listForUser(userId: string) {
    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      include: {
        project: true,
      },
    });

    return memberships.map((m: MembershipWithProject) => ({
      id: m.project.id,
      name: m.project.name,
      description: m.project.description,
      role: m.role,
      createdAt: m.project.createdAt.toISOString(),
    }));
  },

  async getById(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: { user: true },
        },
      },
    });

    if (!project) {
      throw notFound('Project not found');
    }

    const membership = project.members.find((m: MemberWithUser) => m.userId === userId);
    if (!membership) {
      throw notFound('Project not found');
    }

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      role: membership.role,
      createdAt: project.createdAt.toISOString(),
      members: project.members.map((m: MemberWithUser) => ({
        userId: m.userId,
        email: m.user.email,
        displayName: m.user.displayName,
        role: m.role,
      })),
    };
  },

  async delete(projectId: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw notFound('Project not found');
    }
    await prisma.project.delete({ where: { id: projectId } });
  },

  async addMember(projectId: string, email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw notFound('User with this email not found');
    }

    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
    });
    if (existing) {
      throw conflict('User is already a member of this project');
    }

    await prisma.projectMember.create({
      data: { projectId, userId: user.id, role: 'MEMBER' },
    });

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: { user: true },
    });

    return members.map((m: MemberWithUser) => ({
      userId: m.userId,
      email: m.user.email,
      displayName: m.user.displayName,
      role: m.role,
    }));
  },

  async removeMember(projectId: string, targetUserId: string, requestingUserId: string) {
    // Find the admin membership of the requesting user
    const adminMembership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: requestingUserId } },
    });

    if (adminMembership?.role === 'ADMIN' && targetUserId === requestingUserId) {
      throw badRequest('Admin cannot remove themselves from the project');
    }

    const targetMembership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: targetUserId } },
    });

    if (!targetMembership) {
      throw notFound('User is not a member of this project');
    }

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId: targetUserId } },
    });
  },
};
