const users = require('../db/users');
const { listActions, safeLogAction } = require('../db/userActions');
const { sendPaginated } = require('../middleware/pagination');
const { actionsQuerySchema } = require('../validation/adminSchemas');

async function listUsers(req, res) {
  const list = await users.listUsers();
  return res.json(list);
}

async function blockUser(req, res) {
  const existing = await users.getUserById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'User not found' });
  if (existing.is_admin === 1) {
    return res.status(403).json({ error: 'Admin users cannot be blocked' });
  }
  if (existing.id === req.activeUserId) {
    return res.status(403).json({ error: 'You cannot block your own account' });
  }

  const blockedUser = await users.blockUser(existing.id);
  await safeLogAction({
    actorUserId: req.activeUserId,
    targetUserId: blockedUser.id,
    actionType: 'admin_block_user',
    resourceType: 'user',
    resourceId: blockedUser.id,
    details: `blocked ${blockedUser.username}`,
  });
  return res.json(blockedUser);
}

async function unblockUser(req, res) {
  const existing = await users.getUserById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'User not found' });
  if (existing.is_admin === 1) {
    return res.status(403).json({ error: 'Admin users cannot be unblocked through this route' });
  }

  const unblockedUser = await users.unblockUser(existing.id);
  await safeLogAction({
    actorUserId: req.activeUserId,
    targetUserId: unblockedUser.id,
    actionType: 'admin_unblock_user',
    resourceType: 'user',
    resourceId: unblockedUser.id,
    details: `unblocked ${unblockedUser.username}`,
  });
  return res.json(unblockedUser);
}

async function makeAdmin(req, res) {
  const existing = await users.getUserById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'User not found' });
  if (existing.id === req.activeUserId) {
    return res.status(403).json({ error: 'You cannot change your own admin role' });
  }
  if (existing.is_admin === 1) {
    return res.status(409).json({ error: 'User is already an admin' });
  }
  if (existing.blocked_at) {
    return res.status(403).json({ error: 'Blocked users must be unblocked before becoming admins' });
  }

  const promotedUser = await users.makeUserAdmin(existing.id);
  await safeLogAction({
    actorUserId: req.activeUserId,
    targetUserId: promotedUser.id,
    actionType: 'admin_make_admin',
    resourceType: 'user',
    resourceId: promotedUser.id,
    details: `made ${promotedUser.username} an admin`,
  });
  return res.json(promotedUser);
}

async function listUserActions(req, res) {
  const { error, value } = actionsQuerySchema.validate(req.query);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { page, limit, userId, actionType, resourceType } = value;
  const rows = await listActions({ page, limit, userId, actionType, resourceType });
  return sendPaginated(req, res, rows, { page, limit, query: value });
}

module.exports = { listUsers, blockUser, unblockUser, makeAdmin, listUserActions };
