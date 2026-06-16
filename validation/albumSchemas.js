// Joi schemas for /albums (Stage F). The owner is taken from the JWT, never the URL,
// so there is deliberately no userId query param to spoof.
const Joi = require('joi');

const createSchema = Joi.object({
  title: Joi.string().min(1).required(),
});

const updateSchema = Joi.object({
  title: Joi.string().min(1),
}).min(1);

// List query: pagination (page/limit) + optional title search (q). Query-string values
// arrive as strings, so Joi coerces page/limit to numbers (convert is on by default).
const listQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(6),
  q: Joi.string().allow('').default(''),
});

module.exports = { createSchema, updateSchema, listQuerySchema };
