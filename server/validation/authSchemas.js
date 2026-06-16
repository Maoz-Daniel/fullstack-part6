// Joi schemas for auth input. Never trust req.body — validate before touching the DB.
const Joi = require('joi');
const { createSchema: registerSchema } = require('./userSchemas');

// Register: identity + credentials. is_admin is intentionally NOT accepted from the
// client (defaults to 0 in the schema). phone/website are optional.
const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

module.exports = { registerSchema, loginSchema };
