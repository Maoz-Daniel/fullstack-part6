// Auth routes: POST /register and POST /login.
// All credential work goes through the SQL SECURITY DEFINER procedures
// (sp_set_password / sp_verify_login). App code never touches users_passwords.
const express = require('express');
const { query } = require('../db/connection');
const { registerSchema, loginSchema } = require('../validation/authSchemas');

const router = express.Router();

// POST /register -> create the user, then set its password via sp_set_password.
// The INSERT + CALL run in one transaction so a username can't be reserved with no
// usable password. Returns the created user (never a password). 201 on success.
router.post('/register', async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { name, username, email, password, phone, website } = value;

  await query('START TRANSACTION');
  try {
    const result = await query(
      `INSERT INTO users (name, username, email, phone, website)
       VALUES (?, ?, ?, ?, ?)`,
      [name, username, email, phone || null, website || null]
    );
    const id = result.insertId;

    // Hashing + per-row salt happen inside the definer procedure.
    await query('CALL sp_set_password(?, ?)', [id, password]);

    await query('COMMIT');
    return res.status(201).json({
      id, name, username, email,
      phone: phone || null,
      website: website || null,
      is_admin: 0,
    });
  } catch (err) {
    await query('ROLLBACK');
    // username/email are UNIQUE across all rows -> reserved identities.
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'username or email already taken' });
    }
    throw err; // unexpected -> central error handler -> 500
  }
});

// POST /login -> verify via sp_verify_login. The proc returns the user row only when
// the password matches AND the user is not blocked/deleted; otherwise no rows.
// Stateless: we return the user; the client stores it in LocalStorage (Stage C).
router.post('/login', async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { username, password } = value;
  const result = await query('CALL sp_verify_login(?, ?)', [username, password]);
  const rows = result[0]; // CALL nests the proc's SELECT rows under index 0

  if (rows.length !== 1) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  res.json(rows[0]);
});

module.exports = router;
