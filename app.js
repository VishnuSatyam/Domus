const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");

app.engine("ejs", ejsMate);

const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js");
const Review = require("./models/review.js");

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");
}

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

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

app.get("/", (req, res) => {
  res.send("root is working");
});

app.get("/listings", async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index", { allListings });
});

// new route

app.get("/listings/new", (req, res) => {
  res.render("listings/new");
});

// show route
app.get("/listings/:id", async (req, res) => {
  const { id } = req.params;

  // Check if the ID is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ExpressError("Page Not Found", 404);
  }

  const listing = await Listing.findById(id).populate("reviews");

  // Check if a listing with this ID exists
  if (!listing) {
    throw new ExpressError("Page Not Found", 404);
  }

  res.render("listings/show", { listing });
});

// create route
app.post("/listings", validateListing, async (req, res) => {
  const newListing = new Listing(req.body.listing);
  await newListing.save();

  res.redirect(`/listings/${newListing._id}`);
});

// edit route
app.get("/listings/:id/edit", async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit", { listing });
});

// update route

app.put("/listings/:id", validateListing, async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  res.redirect(`/listings/${id}`);
});

// delete route
app.delete("/listings/:id", async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndDelete(id);
  res.redirect("/listings");
});

// reviews post route

app.post("/listings/:id/reviews", validateReview, async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    throw new ExpressError("Listing not found", 404);
  }

  const newReview = new Review(req.body.review);

  listing.reviews.push(newReview);
  await newReview.save();
  await listing.save();

  res.redirect(`/listings/${listing._id}`);
});

// delete a single review from a listing
app.delete("/listings/:id/reviews/:reviewId", async (req, res) => {
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
    { new: true }
  );

  if (!listing) {
    throw new ExpressError("Review not found for this listing", 404);
  }

  await Review.findByIdAndDelete(reviewId);
  res.redirect(`/listings/${id}`);
});

// app.get("/testListing" , async(req , res)=>{
//     let sampleListing = new Listing({
//         title: "My New Vila",
//         description: "By the beach",
//         price: 1200,
//         location: "Calangute , Goa",
//         country: "India",
//     });
//     await sampleListing.save();
//     console.log("sample was saved");
//     res.send("successful testing");
// });

app.all("/*splat", (req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

// error handling middleware
app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Oh No, Something Went Wrong!";
  res.status(statusCode).render("error", { err });
});

app.listen(8080, () => {
  console.log("server is listening on port 8080");
});
