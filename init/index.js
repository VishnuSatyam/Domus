const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const { requireDatabaseUrl } = require("../utils/config.js");

const initDB = async () => {
  await mongoose.connect(requireDatabaseUrl());
  const User = require("../models/user.js");
  const owner = await User.findOne({ username: process.env.SEED_OWNER_USERNAME });
  if (!owner) throw new Error("Create a user first, then set SEED_OWNER_USERNAME before seeding listings.");
  await Listing.deleteMany({});
  await Listing.insertMany(initData.data.map((listing) => ({ ...listing, owner: owner._id })));
  console.log("data was initialized");
};

initDB()
  .catch((err) => { console.error(err.message); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
