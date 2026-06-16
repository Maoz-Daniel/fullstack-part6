const { query } = require('./connection');

async function logAction({
  actorUserId = null,
  targetUserId = null,
  actionType,
  resourceType = null,
  resourceId = null,
  details = null,
}) {
  await query(
    `INSERT INTO user_actions
       (actor_user_id, target_user_id, action_type, resource_type, resource_id, details)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [actorUserId, targetUserId, actionType, resourceType, resourceId, details]
  );
}

async function safeLogAction(action) {
  try {
    await logAction(action);
  } catch (err) {
    console.error('Failed to write user action log:', err.message);
  }
}

async function listActions({ page, limit, userId, actionType, resourceType }) {
  const where = [];
  const params = [];

  if (userId !== undefined) {
    where.push('(actions.actor_user_id = ? OR actions.target_user_id = ?)');
    params.push(userId, userId);
  }
  if (actionType) {
    where.push('actions.action_type = ?');
    params.push(actionType);
  }
  if (resourceType) {
    where.push('actions.resource_type = ?');
    params.push(resourceType);
  }

  params.push(limit + 1, (page - 1) * limit);

  return query(
    `SELECT actions.id, actions.actor_user_id, actions.target_user_id, actions.action_type,
            actions.resource_type, actions.resource_id, actions.details, actions.created_at,
            actor.username AS actor_username, actor.email AS actor_email,
            target.username AS target_username, target.email AS target_email
     FROM user_actions actions
     LEFT JOIN users actor ON actor.id = actions.actor_user_id
     LEFT JOIN users target ON target.id = actions.target_user_id
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY actions.id DESC
     LIMIT ? OFFSET ?`,
    params
  );
}

module.exports = { logAction, safeLogAction, listActions };
