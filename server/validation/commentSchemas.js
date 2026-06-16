// Joi schemas for /comments.
const Joi = require('joi');

const createSchema = Joi.object({
  post_id: Joi.number().integer().positive().required(),
  body: Joi.string().min(1).required(),
});

const updateSchema = Joi.object({
  body: Joi.string().min(1).required(),
});

const listQuerySchema = Joi.object({
  postId: Joi.number().integer().positive(),
  userId: Joi.number().integer().positive(),
});

module.exports = { createSchema, updateSchema, listQuerySchema };
