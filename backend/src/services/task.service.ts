import { prisma } from '../lib/prisma';
import { notFound, forbidden, unprocessable } from '../lib/errors';
import type { CreateTaskInput } from '../schemas/task.schema';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

interface TaskFilters {
  status?: TaskStatus;
  assigneeId?: string;
}

interface RequestingUser {
  id: string;
  projectRole: 'ADMIN' | 'MEMBER';
}

function formatTask(task: {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  projectId: string;
  assignee: { id: string; email: string; displayName: string };
}) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    dueDate: task.dueDate?.toISOString() ?? null,
    assignee: task.assignee,
    projectId: task.projectId,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export const taskService = {
  async create(projectId: string, data: CreateTaskInput) {
    // Verify assignee is a project member
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: data.assigneeId } },
    });
    if (!membership) {
      throw unprocessable('Assignee is not a member of this project');
    }

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        assigneeId: data.assigneeId,
        projectId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        status: 'TODO',
      },
      include: {
        assignee: { select: { id: true, email: true, displayName: true } },
      },
    });

    return formatTask(task);
  },

  async list(projectId: string, filters: TaskFilters) {
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        ...(filters.status && { status: filters.status }),
        ...(filters.assigneeId && { assigneeId: filters.assigneeId }),
      },
      include: {
        assignee: { select: { id: true, email: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tasks.map(formatTask);
  },

  async getById(projectId: string, taskId: string) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, projectId },
      include: {
        assignee: { select: { id: true, email: true, displayName: true } },
      },
    });

    if (!task) {
      throw notFound('Task not found');
    }

    return formatTask(task);
  },

  async updateStatus(taskId: string, status: TaskStatus, requestingUser: RequestingUser) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw notFound('Task not found');
    }

    // Admin can update any task; member can only update their own
    if (requestingUser.projectRole !== 'ADMIN' && task.assigneeId !== requestingUser.id) {
      throw forbidden('You can only update the status of tasks assigned to you');
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { status },
      include: {
        assignee: { select: { id: true, email: true, displayName: true } },
      },
    });

    return formatTask(updated);
  },

  async reassign(taskId: string, newAssigneeId: string, projectId: string) {
    // Verify new assignee is a project member
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: newAssigneeId } },
    });
    if (!membership) {
      throw unprocessable('New assignee is not a member of this project');
    }

    const task = await prisma.task.findFirst({ where: { id: taskId, projectId } });
    if (!task) {
      throw notFound('Task not found');
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { assigneeId: newAssigneeId },
      include: {
        assignee: { select: { id: true, email: true, displayName: true } },
      },
    });

    return formatTask(updated);
  },

  async delete(taskId: string, projectId: string) {
    const task = await prisma.task.findFirst({ where: { id: taskId, projectId } });
    if (!task) {
      throw notFound('Task not found');
    }
    await prisma.task.delete({ where: { id: taskId } });
  },
};
