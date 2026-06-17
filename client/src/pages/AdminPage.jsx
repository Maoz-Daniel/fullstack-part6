import { useEffect, useState } from 'react';
import { Navigate, useOutletContext } from 'react-router-dom';
import { usePaginatedItems } from '../hooks/usePaginatedItems.js';
import {
  blockAdminUser,
  getAdminActionsPage,
  getAdminUsers,
  makeAdminUser,
  unblockAdminUser,
} from '../services/adminService.js';

const ACTION_TYPE_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'login_failed', label: 'Failed login' },
  { value: 'register', label: 'New user registration' },
  { value: 'profile_update', label: 'Profile updated' },
  { value: 'password_change', label: 'Password changed' },
  { value: 'todo_create', label: 'Todo created' },
  { value: 'todo_update', label: 'Todo updated' },
  { value: 'todo_delete', label: 'Todo deleted' },
  { value: 'post_create', label: 'Post created' },
  { value: 'post_update', label: 'Post updated' },
  { value: 'post_delete', label: 'Post deleted' },
  { value: 'comment_create', label: 'Comment created' },
  { value: 'comment_update', label: 'Comment updated' },
  { value: 'comment_delete', label: 'Comment deleted' },
  { value: 'album_create', label: 'Album created' },
  { value: 'album_update', label: 'Album updated' },
  { value: 'album_delete', label: 'Album deleted' },
  { value: 'photo_create', label: 'Photo created' },
  { value: 'photo_update', label: 'Photo updated' },
  { value: 'photo_delete', label: 'Photo deleted' },
  { value: 'admin_block_user', label: 'User blocked by admin' },
  { value: 'admin_unblock_user', label: 'User unblocked by admin' },
  { value: 'admin_make_admin', label: 'User made admin' },
];

const RESOURCE_TYPE_OPTIONS = ['', 'auth', 'user', 'todo', 'post', 'comment', 'album', 'photo'];

function formatUserState(account) {
  if (account.is_admin === 1) return 'Admin';
  if (account.blocked_at) return 'Blocked';
  return 'Active';
}

function formatActionActor(action) {
  if (action.actor_username) return action.actor_username;
  if (action.actor_email) return action.actor_email;
  return 'System';
}

function formatActionTarget(action) {
  if (action.target_username) return action.target_username;
  if (action.target_email) return action.target_email;
  return '-';
}

function formatActionType(actionType) {
  return ACTION_TYPE_OPTIONS.find((option) => option.value === actionType)?.label || actionType || 'Action';
}

function hasDifferentActionTarget(action) {
  if (!action.target_user_id && !action.target_username && !action.target_email) return false;
  return action.actor_user_id !== action.target_user_id;
}

function formatActionTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export function AdminPage() {
  const { user } = useOutletContext();
  const {
    items: actions,
    nextPage,
    isLoadingMore,
    loadMore,
    replaceFirstPage,
  } = usePaginatedItems([], null);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ actionType: '', resourceType: '' });
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingActions, setLoadingActions] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingUserId, setPendingUserId] = useState(null);
  const [error, setError] = useState('');

  if (user.is_admin !== 1) {
    return <Navigate to={`/users/${user.username}/posts`} replace />;
  }

  useEffect(() => {
    let ignore = false;
    setLoadingUsers(true);
    setError('');

    getAdminUsers()
      .then((list) => {
        if (!ignore) setUsers(list);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      })
      .finally(() => {
        if (!ignore) setLoadingUsers(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    setLoadingActions(true);
    setError('');

    getAdminActionsPage(filters)
      .then((pageData) => {
        if (!ignore) replaceFirstPage(pageData);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      })
      .finally(() => {
        if (!ignore) setLoadingActions(false);
      });

    return () => {
      ignore = true;
    };
    // replaceFirstPage is stable enough for our needs; only re-run on a filter change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  async function refreshActions() {
    setError('');
    setIsRefreshing(true);
    try {
      const pageData = await getAdminActionsPage(filters);
      replaceFirstPage(pageData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRefreshing(false);
    }
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  async function handleBlock(account) {
    setPendingUserId(account.id);
    setError('');
    try {
      const updated = await blockAdminUser(account.id);
      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      await refreshActions();
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingUserId(null);
    }
  }

  async function handleUnblock(account) {
    setPendingUserId(account.id);
    setError('');
    try {
      const updated = await unblockAdminUser(account.id);
      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      await refreshActions();
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingUserId(null);
    }
  }

  async function handleMakeAdmin(account) {
    setPendingUserId(account.id);
    setError('');
    try {
      const updated = await makeAdminUser(account.id);
      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      await refreshActions();
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingUserId(null);
    }
  }

  function handleLoadMore() {
    setError('');
    loadMore((page) => getAdminActionsPage({ ...filters, page })).catch((err) => setError(err.message));
  }

  return (
    <section className="content-panel admin-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Admin</p>
          <h2>System management</h2>
          <p className="panel-copy">Review users, block/unblock accounts, and inspect major user activity.</p>
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <section className="admin-section">
        <div className="admin-section__header">
          <h3>Users</h3>
          <span className="todo-count">{users.length} shown</span>
        </div>

        {loadingUsers ? <p className="panel-copy">Loading users...</p> : null}

        {!loadingUsers ? (
          <ul className="admin-user-list">
            {users.map((account) => {
              const isOwnAccount = account.id === user.id;
              const isPending = pendingUserId === account.id;
              const canBlock = account.is_admin !== 1 && !account.blocked_at && !isOwnAccount;
              const canUnblock = account.is_admin !== 1 && Boolean(account.blocked_at);
              const canMakeAdmin = account.is_admin !== 1 && !account.blocked_at && !isOwnAccount;

              return (
                <li className="admin-user-card" key={account.id}>
                  <div className="admin-user-card__meta">
                    <span>#{account.id}</span>
                    <span>{formatUserState(account)}</span>
                  </div>
                  <h3>{account.name}</h3>
                  <p className="admin-user-card__identity">{account.username}</p>
                  <p className="admin-user-card__identity">{account.email}</p>
                  <div className="admin-user-card__actions">
                    {canBlock ? (
                      <button
                        className="button button--danger"
                        type="button"
                        onClick={() => handleBlock(account)}
                        disabled={isPending}
                      >
                        Block
                      </button>
                    ) : null}
                    {canUnblock ? (
                      <button
                        className="button button--secondary"
                        type="button"
                        onClick={() => handleUnblock(account)}
                        disabled={isPending}
                      >
                        Unblock
                      </button>
                    ) : null}
                    {canMakeAdmin ? (
                      <button
                        className="button button--secondary"
                        type="button"
                        onClick={() => handleMakeAdmin(account)}
                        disabled={isPending}
                      >
                        Make admin
                      </button>
                    ) : null}
                    {isOwnAccount ? <span className="admin-user-card__hint">Your account</span> : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>

      <section className="admin-section">
        <div className="admin-section__header">
          <h3>Activity log</h3>
          <div className="admin-section__header-actions">
            <span className="todo-count">{actions.length} loaded</span>
            <button
              className="button button--secondary"
              type="button"
              onClick={refreshActions}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <form className="admin-filters" onSubmit={(event) => event.preventDefault()}>
          <label className="form-field">
            <span>Action</span>
            <select name="actionType" value={filters.actionType} onChange={handleFilterChange}>
              {ACTION_TYPE_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Resource</span>
            <select name="resourceType" value={filters.resourceType} onChange={handleFilterChange}>
              {RESOURCE_TYPE_OPTIONS.map((option) => (
                <option key={option || 'all'} value={option}>
                  {option || 'All resources'}
                </option>
              ))}
            </select>
          </label>
        </form>

        {loadingActions ? <p className="panel-copy">Loading actions...</p> : null}

        {!loadingActions && actions.length === 0 ? <p className="empty-state">No actions match the current filters.</p> : null}

        {!loadingActions && actions.length > 0 ? (
          <ul className="admin-action-list">
            {actions.map((action) => (
              <li className="admin-action-card" key={action.id}>
                <div className="admin-action-card__meta">
                  <span>#{action.id}</span>
                  <span>{formatActionType(action.action_type)}</span>
                  <span>{formatActionTime(action.created_at)}</span>
                </div>
                <p className="admin-action-card__summary">
                  <span>Performed by </span>
                  <strong>{formatActionActor(action)}</strong>
                  {hasDifferentActionTarget(action) ? (
                    <>
                      <span> for </span>
                      <strong>{formatActionTarget(action)}</strong>
                    </>
                  ) : null}
                </p>
                <p className="admin-action-card__summary">
                  {action.resource_type || 'system'}
                  {action.resource_id ? ` #${action.resource_id}` : ''}
                </p>
                <p className="admin-action-card__details">{action.details || 'No extra details.'}</p>
              </li>
            ))}
          </ul>
        ) : null}

        {!loadingActions && nextPage ? (
          <div className="load-more">
            <button
              className="button button--secondary"
              type="button"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? 'Loading...' : 'Load more'}
            </button>
          </div>
        ) : null}
      </section>
    </section>
  );
}
