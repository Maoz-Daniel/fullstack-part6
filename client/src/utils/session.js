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

function buildSessionUser(user) {
  const sessionUser = {
    ...user,
    id: Number(user.id),
  };
  delete sessionUser.password;
  return sessionUser;
}

export function sanitizeSessionUser(user) {
  return hasValidUserShape(user) ? buildSessionUser(user) : null;
}

export function readSessionUser() {
  const rawValue = window.localStorage.getItem(STORAGE_KEY);

  if (!rawValue) return null;

  try {
    return sanitizeSessionUser(JSON.parse(rawValue));
  } catch {
    return null;
  }
}

export function writeSessionUser(user) {
  const sessionUser = sanitizeSessionUser(user);

  if (!sessionUser) {
    throw new Error('A session user must include a numeric id and username.');
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
  return sessionUser;
}

export function clearSessionUser() {
  window.localStorage.removeItem(STORAGE_KEY);
}
