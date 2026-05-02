import { apiClient } from './client';
import type { DashboardSummary } from './types';

export const dashboardApi = {
  getPersonal: () =>
    apiClient.get<DashboardSummary>('/dashboard/me').then((r) => r.data),

  getProject: (projectId: string) =>
    apiClient.get<DashboardSummary>(`/dashboard/projects/${projectId}`).then((r) => r.data),
};
