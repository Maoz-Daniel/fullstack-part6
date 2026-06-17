const Joi = require('joi');

const createSchema = Joi.object({
  album_id: Joi.number().integer().positive().required(),
  title: Joi.string().min(1).required(),
  url: Joi.string().uri().required(),
  thumbnail_url: Joi.string().uri().required(),
});

const updateSchema = Joi.object({
  title: Joi.string().min(1),
  url: Joi.string().uri(),
  thumbnail_url: Joi.string().uri(),
}).min(1);

// List query: optional ?albumId= filter + pagination.
const listQuerySchema = Joi.object({
  albumId: Joi.number().integer().positive(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(8),
});

module.exports = { createSchema, updateSchema, listQuerySchema };
