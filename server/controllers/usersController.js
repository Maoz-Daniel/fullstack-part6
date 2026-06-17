const users = require('../db/users');
const { query } = require('../db/connection');
const { safeLogAction } = require('../db/userActions');
const { createAuthToken } = require('../utils/createAuthToken');
const { createSchema, updateSchema, passwordSchema } = require('../validation/userSchemas');

async function createUser(req, res) {
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const created = await users.createUser(value);
    return res.status(201).json(created);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'username or email already taken' });
    }
    throw err;
  }
}

async function updateUser(req, res) {
  const { error, value } = updateSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const existing = await users.getUserById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'User not found' });
  if (existing.id !== req.activeUserId) {
    return res.status(403).json({ error: 'You can only update your own user profile' });
  }

  try {
    const updated = await users.updateUser(req.params.id, value);
    const token = createAuthToken(updated);
    await safeLogAction({
      actorUserId: req.activeUserId,
      targetUserId: updated.id,
      actionType: 'profile_update',
      resourceType: 'user',
      resourceId: updated.id,
      details: `updated fields: ${Object.keys(value).join(', ')}`,
    });
    return res.json({ user: updated, token });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'username or email already taken' });
    }
    throw err;
  }
}

async function changePassword(req, res) {
  const { error, value } = passwordSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const existing = await users.getUserById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'User not found' });
  if (existing.id !== req.activeUserId) {
    return res.status(403).json({ error: 'You can only change your own password' });
  }

  const verifyResult = await query('CALL sp_verify_login(?, ?)', [
    existing.username,
    value.currentPassword,
  ]);
  const rows = verifyResult[0];
  if (rows.length !== 1) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  await query('CALL sp_set_password(?, ?)', [existing.id, value.newPassword]);
  await safeLogAction({
    actorUserId: req.activeUserId,
    targetUserId: existing.id,
    actionType: 'password_change',
    resourceType: 'user',
    resourceId: existing.id,
    details: 'user changed own password',
  });

  return res.json({ message: 'Password updated' });
}

module.exports = { createUser, updateUser, changePassword };
