import { useEffect, useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { projectsApi } from '../api/projects.api';
import type { Project } from '../api/types';
import type { AxiosError } from 'axios';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const load = () => {
    setLoading(true);
    projectsApi
      .list()
      .then(setProjects)
      .catch(() => setError('Failed to load projects'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      const project = await projectsApi.create({ name, description: description || undefined });
      setProjects((prev) => [project, ...prev]);
      setShowModal(false);
      setName('');
      setDescription('');
    } catch (err) {
      const axiosErr = err as AxiosError<{ error: { message: string } }>;
      setCreateError(axiosErr.response?.data?.error?.message ?? 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">All your projects in one place</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + New Project
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="loading">Loading…</div>}

      {!loading && projects.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <p className="empty-state-text">No projects yet. Create your first one!</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            Create Project
          </button>
        </div>
      )}

      <div className="grid-2">
        {projects.map((project) => (
          <Link key={project.id} to={`/projects/${project.id}`} className="project-card">
            <div className="project-card-name">{project.name}</div>
            {project.description && (
              <div className="project-card-desc">{project.description}</div>
            )}
            <div className="project-card-footer">
              <span className={`badge ${project.role === 'ADMIN' ? 'badge-admin' : 'badge-member'}`}>
                {project.role}
              </span>
              <span style={{ fontSize: 12, color: '#888' }}>
                {new Date(project.createdAt).toLocaleDateString()}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">New Project</h2>
            {createError && <div className="alert alert-error">{createError}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label" htmlFor="proj-name">Project name *</label>
                <input
                  id="proj-name"
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Awesome Project"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="proj-desc">Description</label>
                <textarea
                  id="proj-desc"
                  className="form-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this project about?"
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating…' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
