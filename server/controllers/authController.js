const users = require('../db/users');
const { query } = require('../db/connection');
const { safeLogAction } = require('../db/userActions');
const { createAuthToken } = require('../utils/createAuthToken');
const { registerSchema, loginSchema } = require('../validation/authSchemas');

async function register(req, res) {
  const { error, value } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const created = await users.createUser(value);
    await safeLogAction({
      actorUserId: created.id,
      targetUserId: created.id,
      actionType: 'register',
      resourceType: 'user',
      resourceId: created.id,
      details: `registered ${created.username}`,
    });
    return res.status(201).json(created);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'username or email already taken' });
    }
    throw err;
  }
}

async function login(req, res) {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { username, password } = value;
  const result = await query('CALL sp_verify_login(?, ?)', [username, password]);
  const rows = result[0];

  if (rows.length !== 1) {
    const existingUser = await users.getUserByUsername(username);
    if (existingUser?.blocked_at) {
      await safeLogAction({
        targetUserId: existingUser.id,
        actionType: 'login_failed',
        resourceType: 'auth',
        resourceId: existingUser.id,
        details: `blocked login attempt for ${username}`,
      });
      return res.status(403).json({ error: 'This account is blocked. Please contact an administrator.' });
    }

    await safeLogAction({
      actionType: 'login_failed',
      resourceType: 'auth',
      details: `failed login for ${username}`,
    });
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const user = rows[0];
  const token = createAuthToken(user);
  return res.json({ user, token });
}

module.exports = { register, login };
