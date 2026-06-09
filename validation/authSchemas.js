// Joi schemas for auth input. Never trust req.body — validate before touching the DB.
const Joi = require('joi');

// Register: identity + credentials. is_admin is intentionally NOT accepted from the
// client (defaults to 0 in the schema). phone/website are optional.
const registerSchema = Joi.object({
  name: Joi.string().min(1).required(),
  username: Joi.string().min(1).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().allow('').optional(),
  website: Joi.string().allow('').optional(),
});

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

module.exports = { registerSchema, loginSchema };
