const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { reviewSchema } = require("../schema.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

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

router.post("/:id/reviews", validateReview, async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    throw new ExpressError("Listing not found", 404);
  }

  const newReview = new Review(req.body.review);
  listing.reviews.push(newReview);

  await newReview.save();
  await listing.save();

  req.flash("success", "Review added!");
  res.redirect(`/listings/${listing._id}`);
});

router.delete("/:id/reviews/:reviewId", async (req, res) => {
  const { id, reviewId } = req.params;

  if (
    !mongoose.Types.ObjectId.isValid(id) ||
    !mongoose.Types.ObjectId.isValid(reviewId)
  ) {
    throw new ExpressError("Review not found", 404);
  }

  const listing = await Listing.findOneAndUpdate(
    { _id: id, reviews: reviewId },
    { $pull: { reviews: reviewId } },
    { new: true },
  );

  if (!listing) {
    throw new ExpressError("Review not found for this listing", 404);
  }

  await Review.findByIdAndDelete(reviewId);
  req.flash("success", "Review deleted!");
  res.redirect(`/listings/${id}`);
});

module.exports = router;
