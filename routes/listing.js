const express = require("express");
const router = express.Router();
const { listingSchema } = require("../schema.js");
const ExpressError = require("../utils/ExpressError.js");
const {isLoggedIn, isOwner} = require("../middleware.js");
const listingController = require("../controllers/listing.js");

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

router.route("/")
  .get(listingController.index)
  .post(
    isLoggedIn("You must be logged in to create a listing!"),
    validateListing,
    listingController.createListing,
  );

// new route

router.get(
  "/new",
  isLoggedIn("You must be logged in to create a listing!"),
  listingController.renderNewForm,
);

router.route("/:id")
  .get(listingController.showListing)
  .put(
    isLoggedIn("You must be logged in to edit a listing!"),
    isOwner,
    validateListing,
    listingController.updateListing,
  )
  .delete(
    isLoggedIn("You must be logged in to delete a listing!"),
    isOwner,
    listingController.destroyListing,
  );

// edit route
router.get(
  "/:id/edit",
  isLoggedIn("You must be logged in to edit a listing!"),
  isOwner,
  listingController.renderEditForm,
);

module.exports = router;
