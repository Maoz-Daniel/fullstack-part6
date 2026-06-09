// /users routes. This slice: GET /users (proves the DB connection end-to-end).
const express = require('express');
const { query } = require('../db/connection');

const router = express.Router();

// GET /users -> all active users (soft-delete filter per CLAUDE.md). Never returns a
// password (it doesn't live in `users`). Blocked users are still listed; only
// soft-deleted rows are hidden.
router.get('/', async (req, res) => {
  const users = await query(
    `SELECT id, name, username, email, phone, website, is_admin, blocked_at
     FROM users
     WHERE deleted_at IS NULL
     ORDER BY id`
  );
  res.json(users);
});

module.exports = router;
