const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const ExpressError = require("../utils/ExpressError.js");
const { imageFromUpload, deleteImage } = require("../utils/cloudinary.js");

const listingFields = ["title", "description", "price", "country", "location", "category"];
const pickListingFields = (listing) => Object.fromEntries(
  listingFields.map((field) => [field, listing[field]]),
);

module.exports.index = async (req, res) => {
  const { where = "", category = "all", startDate = "", endDate = "", guests = "" } = req.query;
  const filters = {};
  const normalizedWhere = String(where).trim();
  const allowedCategories = ["all", "home", "experience", "service"];
  const activeCategory = allowedCategories.includes(category) ? category : "all";

  if (normalizedWhere) {
    const escapedWhere = normalizedWhere.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filters.$or = [
      { location: { $regex: escapedWhere, $options: "i" } },
      { country: { $regex: escapedWhere, $options: "i" } },
      { title: { $regex: escapedWhere, $options: "i" } },
    ];
  }
  if (activeCategory !== "all") {
    // Listings created before categories existed remain visible as Homes.
    filters.category = activeCategory === "home"
      ? { $in: ["home", null] }
      : activeCategory;
  }

  const allListings = await Listing.find(filters);
  res.locals.activeCategory = activeCategory;
  res.render("listings/index", { allListings, search: { where: normalizedWhere, startDate, endDate, guests } });
};

module.exports.renderNewForm = (req, res) => {
  return res.render("listings/new");
};

module.exports.showListing = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    req.flash("error", "This listing does not exist.");
    return res.redirect("/listings");
  }

  const listing = await Listing.findById(id).populate({
    path: "reviews",
    populate: {
      path: "author",
    },
  });

  if (!listing) {
    req.flash("error", "This listing does not exist.");
    return res.redirect("/listings");
  }

  res.render("listings/show", { listing });
};

module.exports.createListing = async (req, res) => {
  if (!req.file) throw new ExpressError("A listing image is required.", 400);
  const newListing = new Listing(pickListingFields(req.body.listing));
  newListing.owner = req.user._id;
  newListing.image = imageFromUpload(req.file);
  await newListing.save();
  req.uploadCommitted = true;

  req.flash("success", "New listing created!");
  res.redirect(`/listings/${newListing._id}`);
};

module.exports.renderEditForm = async (req, res) => {
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

  let originalImageUrl = listing.image.url;
  if (originalImageUrl.includes("/upload/")) {
    originalImageUrl = originalImageUrl.replace("/upload/", "/upload/w_250/");
  }
  res.render("listings/edit", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
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

  Object.assign(listing, pickListingFields(req.body.listing));
  const oldImage = listing.image ? listing.image.toObject() : null;
  if (req.file) listing.image = imageFromUpload(req.file);
  await listing.save();
  req.uploadCommitted = Boolean(req.file);

  // Keep the database pointing to the replacement before cleanup. If cleanup
  // fails, the new image remains usable and the error is reported to operators.
  if (req.file) await deleteImage(oldImage);

  req.flash("success", "Listing updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ExpressError("Listing not found", 404);
  }
  const listing = await Listing.findById(id);
  if (!listing) throw new ExpressError("Listing not found", 404);

  // Do external cleanup first: a Cloudinary failure must not leave a deleted
  // listing that can no longer be repaired or retried.
  await deleteImage(listing.image);
  await Review.deleteMany({ _id: { $in: listing.reviews } });
  await listing.deleteOne();
  req.flash("success", "Listing deleted!");
  res.redirect("/listings");
};
