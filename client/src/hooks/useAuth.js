import { useState } from 'react';
import { clearSessionUser, readSession, readSessionUser, writeSession } from '../utils/session.js';

export function getUser() {
  return readSessionUser();
}

export function isAuthenticated() {
  return getUser() !== null;
}

export function useAuth() {
  const [session, setSession] = useState(() => readSession());

  function login(nextSession) {
    const savedSession = writeSession(nextSession);
    setSession(savedSession);
    return savedSession;
  }

  function logout() {
    clearSessionUser();
    setSession(null);
  }

  return {
    user: session?.user || null,
    token: session?.token || null,
    login,
    logout,
    isAuthenticated: session !== null,
  };
}
