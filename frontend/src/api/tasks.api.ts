import { apiClient } from './client';
import type { Task } from './types';

export const tasksApi = {
  list: (projectId: string, filters?: { status?: string; assigneeId?: string }) =>
    apiClient
      .get<Task[]>(`/projects/${projectId}/tasks`, { params: filters })
      .then((r) => r.data),

  create: (
    projectId: string,
    data: { title: string; description?: string; assigneeId: string; dueDate?: string }
  ) =>
    apiClient.post<Task>(`/projects/${projectId}/tasks`, data).then((r) => r.data),

  get: (projectId: string, taskId: string) =>
    apiClient.get<Task>(`/projects/${projectId}/tasks/${taskId}`).then((r) => r.data),

  updateStatus: (projectId: string, taskId: string, status: string) =>
    apiClient
      .patch<Task>(`/projects/${projectId}/tasks/${taskId}`, { status })
      .then((r) => r.data),

  reassign: (projectId: string, taskId: string, assigneeId: string) =>
    apiClient
      .patch<Task>(`/projects/${projectId}/tasks/${taskId}`, { assigneeId })
      .then((r) => r.data),

  delete: (projectId: string, taskId: string) =>
    apiClient.delete(`/projects/${projectId}/tasks/${taskId}`),
};
