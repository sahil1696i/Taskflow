import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { dashboardApi } from '../api/dashboard.api';
import type { DashboardSummary } from '../api/types';

function statusBadge(status: string) {
  const map: Record<string, string> = {
    TODO: 'badge badge-todo',
    IN_PROGRESS: 'badge badge-in-progress',
    DONE: 'badge badge-done',
  };
  const labels: Record<string, string> = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    DONE: 'Done',
  };
  return <span className={map[status] ?? 'badge'}>{labels[status] ?? status}</span>;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardApi
      .getPersonal()
      .then(setSummary)
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Your personal task overview</p>
        </div>
      </div>

      {loading && <div className="loading">Loading…</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {summary && (
        <>
          <div className="grid-3" style={{ marginBottom: 28 }}>
            <div className="stat-card todo">
              <span className="stat-label">To Do</span>
              <span className="stat-value">{summary.taskCounts.TODO}</span>
            </div>
            <div className="stat-card in-progress">
              <span className="stat-label">In Progress</span>
              <span className="stat-value">{summary.taskCounts.IN_PROGRESS}</span>
            </div>
            <div className="stat-card done">
              <span className="stat-label">Done</span>
              <span className="stat-value">{summary.taskCounts.DONE}</span>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">⚠️ Overdue Tasks</h2>
              <span className="badge badge-overdue">{summary.overdueTasks.length}</span>
            </div>
            {summary.overdueTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">✅</div>
                <p className="empty-state-text">No overdue tasks — great work!</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Status</th>
                      <th>Due Date</th>
                      <th>Project</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.overdueTasks.map((task) => (
                      <tr key={task.id}>
                        <td>
                          <Link
                            to={`/projects/${task.projectId}/tasks`}
                            className="task-title-link"
                          >
                            {task.title}
                          </Link>
                        </td>
                        <td>{statusBadge(task.status)}</td>
                        <td style={{ color: '#dc2626' }}>
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString()
                            : '—'}
                        </td>
                        <td>
                          <Link to={`/projects/${task.projectId}`} style={{ color: '#7c83fd', textDecoration: 'none' }}>
                            View project
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  );
}
