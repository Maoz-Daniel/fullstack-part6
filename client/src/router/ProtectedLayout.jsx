import { Navigate, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ProtectedNavigation } from '../components/ProtectedNavigation.jsx';
import { UserInfoPanel } from '../components/UserInfoPanel.jsx';
import { useAuth } from '../hooks/useAuth.js';

export function ProtectedLayout() {
  const { username } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const shouldShowInfo = location.hash === '#user-info';

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (username !== user.username) {
    return <Navigate to={`/users/${user.username}/posts`} replace />;
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <main className="app app--protected">
      <section className="workspace">
        <ProtectedNavigation user={user} onLogout={handleLogout} />
        <Outlet context={{ user }} />
        {shouldShowInfo ? <UserInfoPanel user={user} /> : null}
      </section>
    </main>
  );
}
