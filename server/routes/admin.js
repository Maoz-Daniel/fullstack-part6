const express = require('express');
const users = require('../db/users');
const { listActions, safeLogAction } = require('../db/userActions');
const { authenticateToken } = require('../middleware/authenticateToken');
const { requireAdmin } = require('../middleware/requireAdmin');
const { sendPaginated } = require('../middleware/pagination');
const { actionsQuerySchema } = require('../validation/adminSchemas');

const router = express.Router();

router.use(authenticateToken, requireAdmin);

router.get('/users', async (req, res) => {
  const list = await users.listUsers();
  res.json(list);
});

router.put('/users/:id/block', async (req, res) => {
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
  res.json(blockedUser);
});

router.put('/users/:id/unblock', async (req, res) => {
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
  res.json(unblockedUser);
});

router.put('/users/:id/make-admin', async (req, res) => {
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
  res.json(promotedUser);
});

router.get('/actions', async (req, res) => {
  const { error, value } = actionsQuerySchema.validate(req.query);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { page, limit, userId, actionType, resourceType } = value;
  const rows = await listActions({ page, limit, userId, actionType, resourceType });
  sendPaginated(req, res, rows, { page, limit, query: value });
});

module.exports = router;
