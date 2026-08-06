const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");

async function backfillListingOwners() {
  await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");

  const user = await User.findOne().select("_id username");
  if (!user) {
    throw new Error("Cannot migrate listings: no existing user was found.");
  }

  const result = await Listing.updateMany(
    { owner: null },
    { $set: { owner: user._id } },
  );
  const remainingOwnerless = await Listing.countDocuments({ owner: null });

  console.log({
    owner: user.username,
    matched: result.matchedCount,
    modified: result.modifiedCount,
    remainingOwnerless,
  });
}

backfillListingOwners()
  .catch(console.error)
  .finally(() => mongoose.disconnect());
