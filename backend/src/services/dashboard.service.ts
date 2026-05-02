import { prisma } from '../lib/prisma';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

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

export const dashboardService = {
  async getPersonalSummary(userId: string) {
    const now = new Date();

    const tasks = await prisma.task.findMany({
      where: { assigneeId: userId },
      include: {
        assignee: { select: { id: true, email: true, displayName: true } },
      },
    });

    const taskCounts = {
      TODO: 0,
      IN_PROGRESS: 0,
      DONE: 0,
    };

    const overdueTasks = [];

    for (const task of tasks) {
      taskCounts[task.status as TaskStatus]++;
      if (task.dueDate && task.dueDate < now && task.status !== 'DONE') {
        overdueTasks.push(formatTask(task));
      }
    }

    return {
      taskCounts,
      overdueTasks,
    };
  },

  async getProjectSummary(projectId: string) {
    const now = new Date();

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: { select: { id: true, email: true, displayName: true } },
      },
    });

    const taskCounts = {
      TODO: 0,
      IN_PROGRESS: 0,
      DONE: 0,
    };

    const overdueTasks = [];

    for (const task of tasks) {
      taskCounts[task.status as TaskStatus]++;
      if (task.dueDate && task.dueDate < now && task.status !== 'DONE') {
        overdueTasks.push(formatTask(task));
      }
    }

    return {
      taskCounts,
      overdueTasks,
    };
  },
};
