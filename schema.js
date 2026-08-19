const Joi = require("joi");

const listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().trim().min(3).max(120).required(),
    description: Joi.string().trim().min(1).max(5000).required(),
    price: Joi.number().min(0).max(10000000).required(),
    country: Joi.string().trim().min(2).max(100).required(),
    location: Joi.string().trim().min(2).max(150).required(),
    category: Joi.string().valid("home", "experience", "service").default("home"),
  }).required().unknown(false),
});

module.exports = { listingSchema };

module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().integer().required().min(1).max(5),
    comment: Joi.string().trim().min(1).max(2000).required(),
  }).required().unknown(false),
});
