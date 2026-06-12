export const STORAGE_KEY = 'loggedInUser';

function hasValidUserShape(user) {
  return Boolean(
    user &&
      typeof user === 'object' &&
      Number.isFinite(Number(user.id)) &&
      typeof user.username === 'string' &&
      user.username.trim()
  );
}

function hasValidTokenShape(token) {
  return typeof token === 'string' && token.trim().length > 0;
}

function buildSessionUser(user) {
  const sessionUser = {
    ...user,
    id: Number(user.id),
  };
  delete sessionUser.password;
  return sessionUser;
}

function buildSession(session) {
  return {
    user: buildSessionUser(session.user),
    token: session.token.trim(),
  };
}

export function sanitizeSession(session) {
  if (
    !session ||
    typeof session !== 'object' ||
    !hasValidUserShape(session.user) ||
    !hasValidTokenShape(session.token)
  ) {
    return null;
  }

  return buildSession(session);
}

export function sanitizeSessionUser(user) {
  return hasValidUserShape(user) ? buildSessionUser(user) : null;
}

export function readSession() {
  const rawValue = window.localStorage.getItem(STORAGE_KEY);

  if (!rawValue) return null;

  try {
    const session = sanitizeSession(JSON.parse(rawValue));
    if (!session) {
      clearSessionUser();
    }
    return session;
  } catch {
    clearSessionUser();
    return null;
  }
}

export function readSessionUser() {
  return readSession()?.user || null;
}

export function readSessionToken() {
  return readSession()?.token || null;
}

export function writeSession(session) {
  const nextSession = sanitizeSession(session);

  if (!nextSession || !nextSession.token) {
    throw new Error('A session must include a numeric user id, username, and token.');
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
  return nextSession;
}

export function clearSessionUser() {
  window.localStorage.removeItem(STORAGE_KEY);
}
