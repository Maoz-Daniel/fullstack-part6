import { apiClient } from './apiClient.js';

export function loginUser(credentials) {
  return apiClient('/login', {
    method: 'POST',
    body: credentials,
  });
}

export function registerUser(payload) {
  return apiClient('/register', {
    method: 'POST',
    body: payload,
  });
}
