// Data-access layer for users. Keeps route handlers thin and centralizes the
// soft-delete cascade required by the project conventions.
const { query } = require('./connection');

function userSelectSql() {
  return `SELECT id, name, username, email, phone, website, is_admin, blocked_at
          FROM users`;
}

// List all non-deleted users.
async function listUsers() {
  return query(
    `${userSelectSql()}
     WHERE deleted_at IS NULL
     ORDER BY id`
  );
}

// Single non-deleted user by id, or undefined if missing/soft-deleted.
async function getUserById(id) {
  const rows = await query(
    `${userSelectSql()}
     WHERE id = ? AND deleted_at IS NULL`,
    [id]
  );
  return rows[0];
}

// "Active user" for authenticated flows: must exist and not be blocked/deleted.
async function getActiveUserById(id) {
  const rows = await query(
    `${userSelectSql()}
     WHERE id = ? AND deleted_at IS NULL AND blocked_at IS NULL`,
    [id]
  );
  return rows[0];
}

// Create a login-capable user record and its password atomically.
async function createUser({ name, username, email, password, phone, website }) {
  await query('START TRANSACTION');
  try {
    const result = await query(
      `INSERT INTO users (name, username, email, phone, website)
       VALUES (?, ?, ?, ?, ?)`,
      [name, username, email, phone || null, website || null]
    );

    await query('CALL sp_set_password(?, ?)', [result.insertId, password]);
    await query('COMMIT');

    return getUserById(result.insertId);
  } catch (err) {
    await query('ROLLBACK');
    throw err;
  }
}

// Update the provided profile fields on a non-deleted user, then return the row.
async function updateUser(id, fields) {
  const set = [];
  const params = [];

  if (fields.name !== undefined) {
    set.push('name = ?');
    params.push(fields.name);
  }
  if (fields.username !== undefined) {
    set.push('username = ?');
    params.push(fields.username);
  }
  if (fields.email !== undefined) {
    set.push('email = ?');
    params.push(fields.email);
  }
  if (fields.phone !== undefined) {
    set.push('phone = ?');
    params.push(fields.phone || null);
  }
  if (fields.website !== undefined) {
    set.push('website = ?');
    params.push(fields.website || null);
  }

  params.push(id);
  await query(
    `UPDATE users
     SET ${set.join(', ')}
     WHERE id = ? AND deleted_at IS NULL`,
    params
  );

  return getUserById(id);
}

// Soft delete a user and cascade the soft delete to dependent resources in server code.
async function softDeleteUser(id) {
  await query('START TRANSACTION');
  try {
    await query(
      'UPDATE comments SET deleted_at = NOW() WHERE post_id IN (SELECT id FROM posts WHERE user_id = ?) AND deleted_at IS NULL',
      [id]
    );
    await query(
      'UPDATE posts SET deleted_at = NOW() WHERE user_id = ? AND deleted_at IS NULL',
      [id]
    );
    await query(
      'UPDATE comments SET deleted_at = NOW() WHERE user_id = ? AND deleted_at IS NULL',
      [id]
    );
    await query(
      'UPDATE todos SET deleted_at = NOW() WHERE user_id = ? AND deleted_at IS NULL',
      [id]
    );
    await query(
      'UPDATE users SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    await query('COMMIT');
  } catch (err) {
    await query('ROLLBACK');
    throw err;
  }
}

module.exports = {
  listUsers,
  getUserById,
  getActiveUserById,
  createUser,
  updateUser,
  softDeleteUser,
};
