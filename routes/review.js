const express = require("express");
const router = express.Router();
const { reviewSchema } = require("../schema.js");
const ExpressError = require("../utils/ExpressError.js");
const { isLoggedIn, isReviewAuthor } = require("../middleware.js");
const reviewsController = require("../controllers/reviews.js");

const validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    let msg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(msg, 400);
  }

  next();
};

router.route("/:id/reviews").post(
  isLoggedIn("You must be logged in to create a review!"),
  validateReview,
  reviewsController.createReview,
);

router.route("/:id/reviews/:reviewId").delete(
  isLoggedIn("You must be logged in to delete a review!"),
  isReviewAuthor,
  reviewsController.destroyReview,
);

module.exports = router;
