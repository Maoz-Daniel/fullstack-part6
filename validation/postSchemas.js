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
});

module.exports = { createSchema, updateSchema, listQuerySchema };
