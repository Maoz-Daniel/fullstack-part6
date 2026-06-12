// Joi schemas for todos. Never trust req.body / req.query — validate before the DB.
const Joi = require('joi');

// Create: user_id + title required; completed optional (defaults to false).
const createSchema = Joi.object({
  user_id: Joi.number().integer().positive(),
  title: Joi.string().min(1).required(),
  completed: Joi.boolean().default(false),
});

// Update: title and/or completed; .min(1) requires at least one field.
const updateSchema = Joi.object({
  title: Joi.string().min(1),
  completed: Joi.boolean(),
}).min(1);

// List query filters. Query-string values arrive as strings, so coerce them:
//   userId   -> Joi.number() turns "3" into 3 (convert is on by default)
//   completed-> Joi.boolean() accepts "true"/"false"; .truthy/.falsy add 1/"1" and 0/"0"
const listQuerySchema = Joi.object({
  userId: Joi.number().integer().positive(),
  completed: Joi.boolean().truthy(1, '1').falsy(0, '0'),
});

module.exports = { createSchema, updateSchema, listQuerySchema };
