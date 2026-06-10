// Temporary active-user identification for Stage B. Until the client-side auth flow is
// wired end-to-end, mutating post/comment requests send x-user-id in the request headers.
const users = require('../db/users');

async function requireActiveUser(req, res, next) {
  const raw = req.get('x-user-id');
  if (!raw) return res.status(400).json({ error: 'x-user-id header is required' });

  const activeUserId = Number(raw);
  if (!Number.isInteger(activeUserId) || activeUserId < 1) {
    return res.status(400).json({ error: 'x-user-id must be a positive integer' });
  }

  const activeUser = await users.getActiveUserById(activeUserId);
  if (!activeUser) {
    return res.status(401).json({ error: 'x-user-id does not reference an active user' });
  }

  req.activeUserId = activeUserId;
  req.activeUser = activeUser;
  next(); // Pass control to the next middleware or route handler.
}

module.exports = { requireActiveUser };
