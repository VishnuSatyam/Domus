const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");

app.engine("ejs", ejsMate);

const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const { requireDatabaseUrl, requireSessionSecret } = require("./utils/config.js");
const { deleteImage } = require("./utils/cloudinary.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

const store = MongoStore.create({
  mongoUrl: requireDatabaseUrl(),
  touchAfter: 24 * 60 * 60,
  crypto: {
    secret: requireSessionSecret(),
  },
});

store.on("error", function () {
  // connect-mongo exposes errors here; avoid logging session data or credentials.
  console.error("Session store error");
});
app.locals.sessionStore = store;

const sessionOptions = {
  store: store,
  secret: requireSessionSecret(),
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
};

if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);

app.get("/", (req, res) => {
    res.redirect("/listings");
});



app.use(session({ ...sessionOptions, store }));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  // The shared navbar renders on every page; the listings index overrides this.
  res.locals.activeCategory = "all";
  next();
});

app.use("/listings", listingRouter);
app.use("/listings", reviewRouter);
app.use("/", userRouter);

app.all("/*splat", (req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

// error handling middleware
app.use((err, req, res, next) => {
  if (req.file && !req.uploadCommitted) {
    deleteImage({ publicId: req.file.filename }).catch(() => {
      console.error("Unable to remove an uncommitted upload");
    });
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || "Oh no, something went wrong.";
  if (err.name === "CastError") {
    statusCode = 404;
    message = "The requested resource does not exist.";
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    message = "The submitted data is invalid.";
  } else if (err.name === "MulterError") {
    statusCode = 400;
    message = "The image upload is invalid or too large.";
  }
  if (statusCode >= 500 && process.env.NODE_ENV === "production") {
    message = "Something went wrong. Please try again later.";
  }
  res.status(statusCode).render("error", { err: { message, statusCode } });
});

async function startServer() {
  await mongoose.connect(requireDatabaseUrl());
  const port = process.env.PORT || 8080;
  app.listen(port, () => console.log(`Server listening on port ${port}`));
}

if (require.main === module) {
  startServer().catch((err) => {
    console.error("Unable to connect to the database.");
    process.exitCode = 1;
  });
}

module.exports = app;
