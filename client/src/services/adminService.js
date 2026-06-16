import { apiClient } from './apiClient.js';

function normalizeUser(user) {
  return {
    ...user,
    id: Number(user.id),
    is_admin: Number(user.is_admin),
  };
}

function normalizeAction(action) {
  return {
    ...action,
    id: Number(action.id),
    actor_user_id: action.actor_user_id === null ? null : Number(action.actor_user_id),
    target_user_id: action.target_user_id === null ? null : Number(action.target_user_id),
    resource_id: action.resource_id === null ? null : Number(action.resource_id),
  };
}

export async function getAdminUsers() {
  const users = await apiClient('/admin/users');
  return users.map(normalizeUser);
}

export async function blockAdminUser(id) {
  const user = await apiClient(`/admin/users/${id}/block`, { method: 'PUT' });
  return normalizeUser(user);
}

export async function unblockAdminUser(id) {
  const user = await apiClient(`/admin/users/${id}/unblock`, { method: 'PUT' });
  return normalizeUser(user);
}

export async function makeAdminUser(id) {
  const user = await apiClient(`/admin/users/${id}/make-admin`, { method: 'PUT' });
  return normalizeUser(user);
}

export async function getAdminActionsPage({ page = 1, userId = '', actionType = '', resourceType = '' } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: '5',
  });
  if (userId) params.set('userId', String(userId));
  if (actionType) params.set('actionType', actionType);
  if (resourceType) params.set('resourceType', resourceType);

  const { data, nextPage } = await apiClient(`/admin/actions?${params.toString()}`, {
    withPagination: true,
  });

  return {
    data: data.map(normalizeAction),
    nextPage,
  };
}
