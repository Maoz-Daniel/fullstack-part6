// /users routes — full CRUD. Users are soft-deleted; password changes stay out of this
// route because credentials live behind the auth procedures/table split.
const express = require('express');
const users = require('../db/users');
const { createSchema, updateSchema } = require('../validation/userSchemas');

const router = express.Router();

// GET /users -> all non-deleted users.
router.get('/', async (req, res) => {
  const list = await users.listUsers();
  res.json(list);
});

// GET /users/:id -> one non-deleted user, or 404.
router.get('/:id', async (req, res) => {
  const user = await users.getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// POST /users -> create a full user account and return the created user.
router.post('/', async (req, res) => {
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
});

// PUT /users/:id -> update profile fields on a non-deleted user.
router.put('/:id', async (req, res) => {
  const { error, value } = updateSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const existing = await users.getUserById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'User not found' });

  try {
    const updated = await users.updateUser(req.params.id, value);
    return res.json(updated);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'username or email already taken' });
    }
    throw err;
  }
});

// DELETE /users/:id -> soft delete the user and cascade that soft delete in server code.
router.delete('/:id', async (req, res) => {
  const existing = await users.getUserById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'User not found' });

  await users.softDeleteUser(req.params.id);
  res.json(existing);
});

module.exports = router;
