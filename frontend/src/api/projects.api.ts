import { apiClient } from './client';
import type { Project, ProjectDetail, ProjectMember } from './types';

export const projectsApi = {
  list: () =>
    apiClient.get<Project[]>('/projects').then((r) => r.data),

  create: (data: { name: string; description?: string }) =>
    apiClient.post<Project>('/projects', data).then((r) => r.data),

  get: (projectId: string) =>
    apiClient.get<ProjectDetail>(`/projects/${projectId}`).then((r) => r.data),

  delete: (projectId: string) =>
    apiClient.delete(`/projects/${projectId}`),

  addMember: (projectId: string, email: string) =>
    apiClient.post<ProjectMember[]>(`/projects/${projectId}/members`, { email }).then((r) => r.data),

  removeMember: (projectId: string, userId: string) =>
    apiClient.delete(`/projects/${projectId}/members/${userId}`),
};
