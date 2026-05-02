import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">⚡ TaskFlow</div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard">📊 Dashboard</NavLink>
          <NavLink to="/projects">📁 Projects</NavLink>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">{user?.displayName ?? user?.email}</div>
          <button className="btn btn-secondary btn-sm btn-full" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
