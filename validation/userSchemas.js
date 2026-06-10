// Joi schemas for /users. Create includes password so the endpoint creates a complete
// login-capable account; password changes are a later feature.
const Joi = require('joi');

const createSchema = Joi.object({
  name: Joi.string().min(1).required(),
  username: Joi.string().min(1).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().allow('').optional(),
  website: Joi.string().allow('').optional(),
});

const updateSchema = Joi.object({
  name: Joi.string().min(1),
  username: Joi.string().min(1),
  email: Joi.string().email(),
  phone: Joi.string().allow(''),
  website: Joi.string().allow(''),
}).min(1);

module.exports = { createSchema, updateSchema };
