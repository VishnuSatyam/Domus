const express = require("express");
const router = express.Router();
const { listingSchema } = require("../schema.js");
const ExpressError = require("../utils/ExpressError.js");
const {isLoggedIn, isOwner} = require("../middleware.js");
const listingController = require("../controllers/listing.js");
const multer  = require('multer')
const { storage } = require("../cloudconfig.js");
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new ExpressError("Only image uploads are allowed.", 400));
    cb(null, true);
  },
});

const validateListing = (req, res, next) => {
  const { error, value } = listingSchema.validate(req.body, {
    abortEarly: false,
    convert: true,
  });
  if (error) {
    let msg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(msg, 400);
  }
  req.body = value;
  next();
};

router
  .route("/")
  .get(listingController.index)
  .post(
    isLoggedIn("You must be logged in to create a listing!"),
    upload.single("listing[image]"),
    validateListing,
    listingController.createListing
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
    upload.single("listing[image]"),
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
