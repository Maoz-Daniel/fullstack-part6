// Auth routes: POST /register and POST /login.
// All credential work goes through the SQL SECURITY DEFINER procedures
// (sp_set_password / sp_verify_login). App code never touches users_passwords.
const express = require('express');
const users = require('../db/users');
const { query } = require('../db/connection');
const { safeLogAction } = require('../db/userActions');
const { createAuthToken } = require('../utils/createAuthToken');
const { registerSchema, loginSchema } = require('../validation/authSchemas');

const router = express.Router();

// POST /register -> create the user, then set its password via sp_set_password.
// The INSERT + CALL run in one transaction so a username can't be reserved with no
// usable password. Returns the created user (never a password). 201 on success.
router.post('/register', async (req, res) => {
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
    // username/email are UNIQUE across all rows -> reserved identities.
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'username or email already taken' });
    }
    throw err; // unexpected -> central error handler -> 500
  }
});

// POST /login -> verify via sp_verify_login. The proc returns the user row only when
// the password matches AND the user is not blocked/deleted; otherwise no rows.
// On success we return the user plus a signed JWT for later authenticated requests.
router.post('/login', async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { username, password } = value;
  const result = await query('CALL sp_verify_login(?, ?)', [username, password]);
  const rows = result[0]; // CALL nests the proc's SELECT rows under index 0

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
});

module.exports = router;
