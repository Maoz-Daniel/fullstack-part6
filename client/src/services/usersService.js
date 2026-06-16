import { apiClient } from './apiClient.js';

export function updateUserProfile(id, payload) {
  return apiClient(`/users/${id}`, {
    method: 'PUT',
    body: payload,
  });
}

export function changeUserPassword(id, payload) {
  return apiClient(`/users/${id}/password`, {
    method: 'PUT',
    body: payload,
  });
}
