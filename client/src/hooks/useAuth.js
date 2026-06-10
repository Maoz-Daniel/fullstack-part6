import { useState } from 'react';
import { clearSessionUser, readSessionUser, writeSessionUser } from '../utils/session.js';

export function getUser() {
  return readSessionUser();
}

export function isAuthenticated() {
  return getUser() !== null;
}

export function useAuth() {
  const [user, setUser] = useState(() => readSessionUser());

  function login(nextUser) {
    const sessionUser = writeSessionUser(nextUser);
    setUser(sessionUser);
    return sessionUser;
  }

  function logout() {
    clearSessionUser();
    setUser(null);
  }

  return {
    user,
    login,
    logout,
    isAuthenticated: user !== null,
  };
}
