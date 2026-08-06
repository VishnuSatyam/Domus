const express = require("express");
const router = express.Router();
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");
const usersController = require("../controllers/users.js");

router.route("/signup")
  .get(usersController.renderSignup)
  .post(usersController.signup);

router.route("/login")
  .get(usersController.renderLogin)
  .post(
    saveRedirectUrl,
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true,
    }),
    usersController.login,
  );

router.route("/logout").get(usersController.logout);
module.exports = router;
