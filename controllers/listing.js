const mongoose = require("mongoose");
const Listing = require("../models/listing.js");

module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index", { allListings });
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
  let path = req.file.path;
  let filename = req.file.filename;
  req.body.listing.image = { url: path, filename: filename };
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url: path, filename: filename };
  await newListing.save();

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

  let originalImageUrl= listing.image.url
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
  res.render("listings/edit", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    req.flash("error", "This listing does not exist.");
    return res.redirect("/listings");
  }

  const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  if (req.file) {
    const { path: url, filename } = req.file;
    listing.image = { url, filename };
    await listing.save();
  }

  if (!listing) {
    req.flash("error", "This listing does not exist.");
    return res.redirect("/listings");
  }

  req.flash("success", "Listing updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing deleted!");
  res.redirect("/listings");
};
