const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { listingSchema, reviewSchema } = require("../schema.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");

const validateListing = (req, res, next) => {
  const { error } = listingSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    let msg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(msg, 400);
  }
  next();
};

// index route
router.get("/", async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index", { allListings });
});

// new route

router.get("/new", (req, res) => {
  res.render("listings/new");
});

// show route
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  // Check if the ID is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    req.flash("error", "This listing does not exist.");
    return res.redirect("/listings");
  }

  const listing = await Listing.findById(id).populate("reviews");

  // Check if a listing with this ID exists
  if (!listing) {
    req.flash("error", "This listing does not exist.");
    return res.redirect("/listings");
  }

  res.render("listings/show", { listing });
});

// create route
router.post("/", validateListing, async (req, res) => {
  const newListing = new Listing(req.body.listing);
  await newListing.save();

  req.flash("success", "New listing created!");

  res.redirect(`/listings/${newListing._id}`);
});

// edit route
router.get("/:id/edit", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    req.flash("error", "This listing does not exist.");
    return res.redirect("/listings");
  }

  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "This listing does not exist.");
    return res.redirect("/listings");
  }

  res.render("listings/edit", { listing });
});

// update route

router.put("/:id", validateListing, async (req, res) => {
  let { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    req.flash("error", "This listing does not exist.");
    return res.redirect("/listings");
  }

  const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  if (!listing) {
    req.flash("error", "This listing does not exist.");
    return res.redirect("/listings");
  }

  req.flash("success", "Listing updated!");
  res.redirect(`/listings/${id}`);
});

// delete route
router.delete("/:id", async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing deleted!");
  res.redirect("/listings");
});

module.exports = router;
