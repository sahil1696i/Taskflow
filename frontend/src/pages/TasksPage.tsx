import { useEffect, useState, FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { tasksApi } from '../api/tasks.api';
import { projectsApi } from '../api/projects.api';
import { useAuth } from '../contexts/AuthContext';
import type { Task, ProjectDetail, ProjectMember } from '../api/types';
import type { AxiosError } from 'axios';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

function StatusBadge({ status }: { status: string }) {
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

export default function TasksPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  // Create task modal
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit task modal
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editStatus, setEditStatus] = useState<TaskStatus>('TODO');
  const [editAssigneeId, setEditAssigneeId] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const isAdmin = project?.role === 'ADMIN';
  const members: ProjectMember[] = project?.members ?? [];

  const loadTasks = () => {
    if (!projectId) return;
    const filters: { status?: string; assigneeId?: string } = {};
    if (statusFilter) filters.status = statusFilter;
    if (assigneeFilter) filters.assigneeId = assigneeFilter;
    tasksApi
      .list(projectId, filters)
      .then(setTasks)
      .catch(() => setError('Failed to load tasks'));
  };

  useEffect(() => {
    if (!projectId) return;
    Promise.all([
      projectsApi.get(projectId),
      tasksApi.list(projectId, {}),
    ])
      .then(([proj, taskList]) => {
        setProject(proj);
        setTasks(taskList);
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    if (!loading) loadTasks();
  }, [statusFilter, assigneeFilter]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    setCreateError('');
    setCreating(true);
    try {
      const task = await tasksApi.create(projectId, {
        title: newTitle,
        description: newDesc || undefined,
        assigneeId: newAssigneeId,
        dueDate: newDueDate ? new Date(newDueDate).toISOString() : undefined,
      });
      setTasks((prev) => [task, ...prev]);
      setShowCreate(false);
      setNewTitle('');
      setNewDesc('');
      setNewAssigneeId('');
      setNewDueDate('');
    } catch (err) {
      const axiosErr = err as AxiosError<{ error: { message: string } }>;
      setCreateError(axiosErr.response?.data?.error?.message ?? 'Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (task: Task) => {
    setEditTask(task);
    setEditStatus(task.status);
    setEditAssigneeId(task.assignee.id);
    setEditError('');
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editTask || !projectId) return;
    setEditError('');
    setSaving(true);
    try {
      let updated = editTask;
      if (editStatus !== editTask.status) {
        updated = await tasksApi.updateStatus(projectId, editTask.id, editStatus);
      }
      if (isAdmin && editAssigneeId !== editTask.assignee.id) {
        updated = await tasksApi.reassign(projectId, editTask.id, editAssigneeId);
      }
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setEditTask(null);
    } catch (err) {
      const axiosErr = err as AxiosError<{ error: { message: string } }>;
      setEditError(axiosErr.response?.data?.error?.message ?? 'Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (task: Task) => {
    if (!projectId) return;
    if (!confirm(`Delete task "${task.title}"?`)) return;
    try {
      await tasksApi.delete(projectId, task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch {
      alert('Failed to delete task');
    }
  };

  const canEditTask = (task: Task) =>
    isAdmin || task.assignee.id === user?.id;

  return (
    <Layout>
      <Link to={`/projects/${projectId}`} className="back-link">
        ← Back to Project
      </Link>

      <div className="page-header">
        <div>
          <h1 className="page-title">{project?.name ?? 'Tasks'}</h1>
          <p className="page-subtitle">Task board</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + New Task
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Filters */}
      <div className="filters">
        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
        >
          <option value="">All assignees</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.displayName}
            </option>
          ))}
        </select>
      </div>

      {loading && <div className="loading">Loading…</div>}

      {!loading && tasks.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p className="empty-state-text">No tasks found.</p>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              Create First Task
            </button>
          )}
        </div>
      )}

      {tasks.length > 0 && (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Assignee</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{task.title}</div>
                      {task.description && (
                        <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                          {task.description}
                        </div>
                      )}
                    </td>
                    <td><StatusBadge status={task.status} /></td>
                    <td>{task.assignee.displayName}</td>
                    <td>
                      {task.dueDate ? (
                        <span style={{ color: new Date(task.dueDate) < new Date() && task.status !== 'DONE' ? '#dc2626' : 'inherit' }}>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {canEditTask(task) && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openEdit(task)}
                          >
                            Edit
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(task)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">New Task</h2>
            {createError && <div className="alert alert-error">{createError}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label" htmlFor="task-title">Title *</label>
                <input
                  id="task-title"
                  type="text"
                  className="form-input"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Task title"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="task-desc">Description</label>
                <textarea
                  id="task-desc"
                  className="form-input"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Optional description"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="task-assignee">Assignee *</label>
                <select
                  id="task-assignee"
                  className="form-select"
                  value={newAssigneeId}
                  onChange={(e) => setNewAssigneeId(e.target.value)}
                  required
                >
                  <option value="">Select a team member</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.displayName} ({m.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="task-due">Due Date</label>
                <input
                  id="task-due"
                  type="date"
                  className="form-input"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating…' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editTask && (
        <div className="modal-overlay" onClick={() => setEditTask(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Edit Task</h2>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>{editTask.title}</p>
            {editError && <div className="alert alert-error">{editError}</div>}
            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-status">Status</label>
                <select
                  id="edit-status"
                  className="form-select"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
              {isAdmin && (
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-assignee">Reassign to</label>
                  <select
                    id="edit-assignee"
                    className="form-select"
                    value={editAssigneeId}
                    onChange={(e) => setEditAssigneeId(e.target.value)}
                  >
                    {members.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.displayName} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditTask(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
