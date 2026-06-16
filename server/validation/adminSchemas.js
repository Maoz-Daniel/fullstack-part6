const Joi = require('joi');

const actionsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  userId: Joi.number().integer().positive(),
  actionType: Joi.string().trim().min(1),
  resourceType: Joi.string().trim().min(1),
});

module.exports = { actionsQuerySchema };
