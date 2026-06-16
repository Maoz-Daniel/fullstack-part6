// Joi schemas for /posts.
const Joi = require('joi');

const createSchema = Joi.object({
  title: Joi.string().min(1).required(),
  body: Joi.string().min(1).required(),
});

const updateSchema = Joi.object({
  title: Joi.string().min(1),
  body: Joi.string().min(1),
}).min(1);

const listQuerySchema = Joi.object({
  userId: Joi.number().integer().positive(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(5),
});

module.exports = { createSchema, updateSchema, listQuerySchema };
