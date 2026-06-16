import { Link, NavLink, useLocation } from 'react-router-dom';

function getNavClass({ isActive }) {
  return isActive ? 'nav-link nav-link--active' : 'nav-link';
}

export function ProtectedNavigation({ user, onLogout }) {
  const basePath = `/users/${user.username}`;
  const location = useLocation();

  return (
    <header className="topbar">
      <div>
        <h1 className="topbar__title">{user.name}</h1>
      </div>

      <nav className="topbar__nav" aria-label="Application navigation">
        <NavLink className={getNavClass} to={`${basePath}/posts`}>
          Posts
        </NavLink>
        <NavLink className={getNavClass} to={`${basePath}/todos`}>
          Todos
        </NavLink>
        <NavLink className={getNavClass} to={`${basePath}/albums`}>
          Albums
        </NavLink>
        <Link className="nav-link" to={`${location.pathname}#user-info`}>
          Info
        </Link>
        <button className="button button--danger" type="button" onClick={onLogout}>
          Logout
        </button>
      </nav>
    </header>
  );
}
