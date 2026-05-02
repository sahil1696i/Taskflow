import { useEffect, useState, FormEvent } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { projectsApi } from '../api/projects.api';
import type { ProjectDetail, ProjectMember } from '../api/types';
import type { AxiosError } from 'axios';

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add member
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState('');

  // Delete project
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    if (!projectId) return;
    setLoading(true);
    projectsApi
      .get(projectId)
      .then(setProject)
      .catch(() => setError('Failed to load project'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [projectId]);

  const handleAddMember = async (e: FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    setAddMemberError('');
    setAddingMember(true);
    try {
      const members = await projectsApi.addMember(projectId, memberEmail);
      setProject((prev) => prev ? { ...prev, members } : prev);
      setMemberEmail('');
      setShowAddMember(false);
    } catch (err) {
      const axiosErr = err as AxiosError<{ error: { message: string } }>;
      setAddMemberError(axiosErr.response?.data?.error?.message ?? 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (member: ProjectMember) => {
    if (!projectId) return;
    if (!confirm(`Remove ${member.displayName} from this project?`)) return;
    try {
      await projectsApi.removeMember(projectId, member.userId);
      setProject((prev) =>
        prev ? { ...prev, members: prev.members.filter((m) => m.userId !== member.userId) } : prev
      );
    } catch (err) {
      const axiosErr = err as AxiosError<{ error: { message: string } }>;
      alert(axiosErr.response?.data?.error?.message ?? 'Failed to remove member');
    }
  };

  const handleDeleteProject = async () => {
    if (!projectId) return;
    if (!confirm('Delete this project and all its tasks? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await projectsApi.delete(projectId);
      navigate('/projects');
    } catch {
      alert('Failed to delete project');
      setDeleting(false);
    }
  };

  const isAdmin = project?.role === 'ADMIN';

  return (
    <Layout>
      <Link to="/projects" className="back-link">← Back to Projects</Link>

      {loading && <div className="loading">Loading…</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {project && (
        <>
          <div className="page-header">
            <div>
              <h1 className="page-title">{project.name}</h1>
              {project.description && (
                <p className="page-subtitle">{project.description}</p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link to={`/projects/${projectId}/tasks`} className="btn btn-primary">
                View Tasks
              </Link>
              {isAdmin && (
                <button
                  className="btn btn-danger"
                  onClick={handleDeleteProject}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting…' : 'Delete Project'}
                </button>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Team Members ({project.members.length})</h2>
              {isAdmin && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddMember(true)}>
                  + Add Member
                </button>
              )}
            </div>

            {project.members.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-text">No members yet.</p>
              </div>
            ) : (
              <div>
                {project.members.map((member) => (
                  <div key={member.userId} className="member-item">
                    <div className="member-info">
                      <span className="member-name">{member.displayName}</span>
                      <span className="member-email">{member.email}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className={`badge ${member.role === 'ADMIN' ? 'badge-admin' : 'badge-member'}`}>
                        {member.role}
                      </span>
                      {isAdmin && member.role !== 'ADMIN' && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRemoveMember(member)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {showAddMember && (
        <div className="modal-overlay" onClick={() => setShowAddMember(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Add Team Member</h2>
            {addMemberError && <div className="alert alert-error">{addMemberError}</div>}
            <form onSubmit={handleAddMember}>
              <div className="form-group">
                <label className="form-label" htmlFor="member-email">Email address</label>
                <input
                  id="member-email"
                  type="email"
                  className="form-input"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  required
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddMember(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={addingMember}>
                  {addingMember ? 'Adding…' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
