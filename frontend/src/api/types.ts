export interface User {
  id: string;
  email: string;
  displayName: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  role: 'ADMIN' | 'MEMBER';
  createdAt: string;
}

export interface ProjectMember {
  userId: string;
  email: string;
  displayName: string;
  role: 'ADMIN' | 'MEMBER';
}

export interface ProjectDetail extends Project {
  members: ProjectMember[];
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  dueDate: string | null;
  assignee: User;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  taskCounts: {
    TODO: number;
    IN_PROGRESS: number;
    DONE: number;
  };
  overdueTasks: Task[];
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    fields?: string[];
  };
}
