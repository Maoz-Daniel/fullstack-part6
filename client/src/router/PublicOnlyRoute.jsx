import { Navigate, Outlet } from 'react-router-dom';
import { readSessionUser } from '../utils/session.js';

export function PublicOnlyRoute() {
  const user = readSessionUser();

  if (user) {
    return <Navigate to={`/users/${user.username}/posts`} replace />;
  }

  return <Outlet />;
}
