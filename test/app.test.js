process.env.NODE_ENV = "test";
process.env.SESSION_SECRET = "test-only-session-secret";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const { after, afterEach, before, test } = require("node:test");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

let mongoServer;
let app;
let Listing;
let Review;
let User;

const listingData = { title: "Quiet apartment", description: "A calm, comfortable place to stay.", price: 1200, country: "India", location: "Goa" };

async function createUser(username) {
  return User.register(new User({ username, email: `${username}@example.test` }), "password123");
}

async function login(username) {
  const agent = request.agent(app);
  await agent.post("/login").type("form").send({ username, password: "password123" }).expect(302);
  return agent;
}

async function createListing(owner, fields = {}) {
  return Listing.create({ ...listingData, ...fields, image: fields.image || { url: "https://example.test/image.jpg" }, owner: owner._id });
}

before(async () => {
  const bundledMongod = "C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe";
  const systemBinary = process.env.MONGOMS_SYSTEM_BINARY || (fs.existsSync(bundledMongod) ? bundledMongod : undefined);
  mongoServer = await MongoMemoryServer.create({ binary: systemBinary ? { systemBinary } : undefined });
  process.env.ATLASDB_URL = mongoServer.getUri();
  app = require("../app.js");
  Listing = require("../models/listing.js");
  Review = require("../models/review.js");
  User = require("../models/user.js");
  await mongoose.connect(process.env.ATLASDB_URL);
});

afterEach(async () => {
  await Promise.all([Listing.deleteMany({}), Review.deleteMany({}), User.deleteMany({})]);
});

after(async () => {
  await app.locals.sessionStore.close();
  await mongoose.disconnect();
  await mongoServer.stop();
});

test("unauthenticated users cannot change listings or create reviews", async () => {
  const owner = await createUser("owner");
  const listing = await createListing(owner);
  await request(app).post("/listings").type("form").send({ listing: listingData }).expect(302);
  await request(app).get(`/listings/${listing._id}/edit`).expect(302);
  await request(app).delete(`/listings/${listing._id}`).expect(302);
  await request(app).post(`/listings/${listing._id}/reviews`).type("form").send({ review: { rating: 5, comment: "Great stay" } }).expect(302);
});

test("listing owners can edit and delete, while other users cannot", async () => {
  const owner = await createUser("owner");
  await createUser("other");
  const listing = await createListing(owner);
  const ownerAgent = await login("owner");
  const otherAgent = await login("other");
  await ownerAgent.put(`/listings/${listing._id}`).type("form").send({ listing: { ...listingData, title: "Updated apartment" } }).expect(302);
  assert.equal((await Listing.findById(listing._id)).title, "Updated apartment");
  await otherAgent.get(`/listings/${listing._id}/edit`).expect(302);
  await otherAgent.delete(`/listings/${listing._id}`).expect(302);
  assert.ok(await Listing.findById(listing._id));
  await ownerAgent.delete(`/listings/${listing._id}`).expect(302);
  assert.equal(await Listing.findById(listing._id), null);
});

test("review authors may delete their review but other users may not", async () => {
  const owner = await createUser("owner");
  const author = await createUser("author");
  await createUser("other");
  const listing = await createListing(owner);
  const review = await Review.create({ rating: 5, comment: "Excellent place", author: author._id });
  listing.reviews.push(review._id);
  await listing.save();
  const otherAgent = await login("other");
  await otherAgent.delete(`/listings/${listing._id}/reviews/${review._id}`).expect(302);
  assert.ok(await Review.findById(review._id));
  const authorAgent = await login("author");
  await authorAgent.delete(`/listings/${listing._id}/reviews/${review._id}`).expect(302);
  assert.equal(await Review.findById(review._id), null);
});

test("invalid listing and review input is rejected by server-side validation", async () => {
  const owner = await createUser("owner");
  const listing = await createListing(owner);
  const agent = await login("owner");
  await agent.put(`/listings/${listing._id}`).type("form").send({ listing: { ...listingData, price: -1 } }).expect(400);
  await agent.put(`/listings/${listing._id}`).type("form").send({ listing: { title: "Missing fields" } }).expect(400);
  await agent.post(`/listings/${listing._id}/reviews`).type("form").send({ review: { rating: 6, comment: "Bad rating" } }).expect(400);
  await agent.post(`/listings/${listing._id}/reviews`).type("form").send({ review: { rating: 4 } }).expect(400);
});

test("invalid and missing resources are handled without database cast failures", async () => {
  const owner = await createUser("owner");
  const listing = await createListing(owner);
  const agent = await login("owner");
  await request(app).get("/listings/not-an-object-id").expect(302);
  await request(app).get(`/listings/${new mongoose.Types.ObjectId()}`).expect(302);
  await agent.delete(`/listings/${listing._id}/reviews/${new mongoose.Types.ObjectId()}`).expect(302);
});

test("listing update preserves an image unless a replacement upload is supplied", async () => {
  const owner = await createUser("owner");
  const listing = await createListing(owner, { image: { url: "https://example.test/old.jpg", publicId: "domus_DEV/old" } });
  const agent = await login("owner");
  await agent.put(`/listings/${listing._id}`).type("form").send({ listing: { ...listingData, description: "Updated text only" } }).expect(302);
  assert.equal((await Listing.findById(listing._id)).image.url, "https://example.test/old.jpg");
  const controller = require("../controllers/listing.js");
  const { cloudinary } = require("../cloudconfig.js");
  const originalDestroy = cloudinary.uploader.destroy;
  const deleted = [];
  cloudinary.uploader.destroy = async (publicId) => { deleted.push(publicId); return { result: "ok" }; };
  try {
    await controller.updateListing({ params: { id: listing._id.toString() }, body: { listing: { ...listingData, category: "home", title: "With replacement" } }, file: { path: "https://example.test/new.jpg", filename: "domus_DEV/new" }, flash() {}, user: owner }, { redirect() {} });
  } finally {
    cloudinary.uploader.destroy = originalDestroy;
  }
  const updated = await Listing.findById(listing._id);
  assert.equal(updated.image.publicId, "domus_DEV/new");
  assert.deepEqual(deleted, ["domus_DEV/old"]);
});

test("destination and category controls filter listings", async () => {
  const owner = await createUser("owner");
  await createListing(owner, { title: "Goa home", location: "Goa", category: "home" });
  await createListing(owner, { title: "Delhi tour", location: "Delhi", category: "experience" });

  const response = await request(app).get("/listings?where=goa&category=home").expect(200);
  assert.match(response.text, /Goa home/);
  assert.doesNotMatch(response.text, /Delhi tour/);
});
