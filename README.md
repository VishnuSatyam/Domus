# Domus

<<<<<<< HEAD
Domus (Latin for "home") is a full-stack property rental platform built with Node.js, Express, and MongoDB. Users can sign up, list properties for rent, upload images, browse listings, and leave star-rated reviews — with full authentication and ownership-based authorization protecting who can edit or delete what.
=======
Domus is a Node.js and Express property-listing application. Users can sign up, sign in, create and manage their own listings, upload listing images, and leave or remove their own reviews.
>>>>>>> 8b4b964 (harden app for production)

## Production foundation

<<<<<<< HEAD
- **User authentication** — sign up, log in, and log out with secure session-based auth (Passport.js + passport-local-mongoose)
- **Authorization** — only a listing's owner can edit or delete it; only a review's author can delete it; protected routes redirect anonymous users to log in first (and return them to where they started afterward)
- **Browse listings** — view all available stays in a responsive card grid
- **View details** — see full information for a single listing, including price, location, country, and reviews
- **Create, edit & delete listings** — logged-in users can list a place with a title, description, image, price, and location, and manage listings they own
- **Image upload** — listing photos are uploaded via Multer and stored on Cloudinary, not the local filesystem
- **Reviews & ratings** — logged-in users can leave a star rating (1–5) and comment on a listing; deleting a listing cleans up its associated reviews automatically
- **Server-side validation** — listing and review data is validated with Joi before it touches the database
- **Flash messages** — success/error feedback after actions like login, signup, or CRUD operations
- **Custom error handling** — a centralized error handler and friendly error page for invalid requests, missing listings, or unmatched routes
=======
- Server-side Joi validation rejects malformed listing and review requests, including unexpected ownership fields.
- Mongoose enforces core database integrity for listings and reviews.
- Listing updates load, modify, validate, and save one document; `owner` and `reviews` are never accepted from the browser.
- New Cloudinary uploads store both URL and public ID. Replacing or deleting a listing cleans up only assets in the `domus_DEV` folder. Failed Cloudinary cleanup is surfaced rather than silently ignored.
- Sessions are stored in MongoDB, are not created for anonymous visitors, and use `httpOnly`, `sameSite=lax`, and production-only `secure` cookies.
- Indexes support current ownership queries and future location/country filtering: `owner`, `location`, and `country` on listings; `author` on reviews.
- The application handles invalid IDs, validation errors, Mongoose validation errors, upload errors, and unexpected failures through the shared error page without exposing production internals.
>>>>>>> 8b4b964 (harden app for production)

## Setup

<<<<<<< HEAD
| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Server framework | [Express](https://expressjs.com/) 5 |
| Database | MongoDB Atlas (via [Mongoose](https://mongoosejs.com/)) |
| Templating | [EJS](https://ejs.co/) + [ejs-mate](https://www.npmjs.com/package/ejs-mate) for layouts |
| Auth | [Passport.js](https://www.passportjs.org/) (local strategy) + [passport-local-mongoose](https://www.npmjs.com/package/passport-local-mongoose) |
| Sessions | [express-session](https://www.npmjs.com/package/express-session) with [connect-mongo](https://www.npmjs.com/package/connect-mongo) session store |
| Image storage | [Cloudinary](https://cloudinary.com/) via [Multer](https://www.npmjs.com/package/multer) + [multer-storage-cloudinary](https://www.npmjs.com/package/multer-storage-cloudinary) |
| Validation | [Joi](https://joi.dev/) |
| Styling | Bootstrap + custom CSS |
| Misc | [method-override](https://www.npmjs.com/package/method-override) for PUT/DELETE from HTML forms, [connect-flash](https://www.npmjs.com/package/connect-flash) for flash messages |

## 📂 Project Structure

```
Domus/
├── app.js                     # Main Express app, session/auth setup & route mounting
├── schema.js                  # Joi validation schemas for listings & reviews
├── middleware.js              # Auth & ownership middleware (isLoggedIn, isOwner, isReviewAuthor)
├── cloudconfig.js             # Cloudinary + Multer storage configuration
├── controllers/
│   ├── listing.js             # Listing CRUD logic
│   ├── reviews.js             # Review create/delete logic
│   └── users.js                # Signup/login/logout logic
├── models/
│   ├── listing.js             # Mongoose Listing model (with cascading review deletion)
│   ├── review.js              # Mongoose Review model
│   └── user.js                 # Mongoose User model (passport-local-mongoose)
├── routes/
│   ├── listing.js             # Listing routes
│   ├── review.js              # Review routes
│   └── user.js                 # Auth routes
├── init/
│   ├── data.js                 # Sample seed data
│   └── index.js                # Script to seed the database
├── utils/
│   ├── ExpressError.js        # Custom error class
│   └── backfillListingOwners.js # One-off script to backfill owner field on existing listings
├── views/
│   ├── layouts/                # Shared page layout (boilerplate)
│   ├── includes/               # Navbar & footer partials
│   ├── listings/               # Index, show, new, edit templates
│   ├── users/                   # Signup & login templates
│   └── error.ejs               # Error page template
└── public/
    ├── css/                     # Custom stylesheets
    └── js/                      # Client-side form validation script
=======
Install dependencies with `npm install`, then set these environment variables in a local `.env` file (never commit it):

```env
ATLASDB_URL=mongodb://127.0.0.1:27017/domus
SESSION_SECRET=replace-with-a-long-random-secret
CLOUD_NAME=...
CLOUD_API_KEY=...
CLOUD_API_SECRET=...
NODE_ENV=development
# Optional: use explicit resolvers when mongodb+srv DNS is blocked locally
DNS_SERVERS=1.1.1.1,8.8.8.8
>>>>>>> 8b4b964 (harden app for production)
```

`SECRET` remains supported as a legacy session-secret name, but `SESSION_SECRET` is preferred. In production, set `NODE_ENV=production`; serve the application through HTTPS so secure session cookies work correctly.

Start the app:

<<<<<<< HEAD
- [Node.js](https://nodejs.org/) (v18+ recommended)
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (or a local MongoDB instance)
- A free [Cloudinary](https://cloudinary.com/) account (for image uploads)
=======
```bash
npm start
```
>>>>>>> 8b4b964 (harden app for production)

Visit `http://localhost:8080/listings`.

## Tests

```bash
npm test
npm run test:watch
```

<<<<<<< HEAD
3. Create a `.env` file in the project root with the following variables:
   ```bash
   ATLASDB_URL=your_mongodb_connection_string
   SECRET=your_session_secret
   CLOUD_NAME=your_cloudinary_cloud_name
   CLOUD_API_KEY=your_cloudinary_api_key
   CLOUD_API_SECRET=your_cloudinary_api_secret
   ```

4. Seed the database with sample listings
   ```bash
   node init/index.js
   ```

5. Start the server
   ```bash
   node app.js
   ```

6. Open your browser and visit
   ```
   http://localhost:8080/listings
   ```
=======
The route tests use `mongodb-memory-server`, which creates a temporary database. They do not use the configured application database or a real Cloudinary account; Cloudinary deletion is mocked for the image-replacement test.

## Maintenance scripts

The historical owner-backfill migration is retained for databases created before listings had required owners. It uses `ATLASDB_URL` and refuses to run unless explicitly confirmed:
>>>>>>> 8b4b964 (harden app for production)

```bash
CONFIRM_LISTING_OWNER_BACKFILL=true node utils/backfillListingOwners.js
```

It assigns ownerless listings to the first existing user, so inspect the target database and back it up before running it. The optional seed script also uses `ATLASDB_URL`; create a user first and specify its username:

```bash
SEED_OWNER_USERNAME=your-username node init/index.js
```

## Routes

### Listings

| Method | Route | Description | Auth required |
|---|---|---|---|
| GET | `/listings` | View all listings | No |
| GET | `/listings/new` | Form to create a new listing | Yes |
| POST | `/listings` | Create a new listing | Yes |
| GET | `/listings/:id` | View a single listing | No |
| GET | `/listings/:id/edit` | Form to edit a listing | Yes (owner only) |
| PUT | `/listings/:id` | Update a listing | Yes (owner only) |
| DELETE | `/listings/:id` | Delete a listing | Yes (owner only) |

### Reviews

| Method | Route | Description | Auth required |
|---|---|---|---|
| POST | `/listings/:id/reviews` | Add a review to a listing | Yes |
| DELETE | `/listings/:id/reviews/:reviewId` | Delete a review | Yes (author only) |

### Auth

| Method | Route | Description |
<<<<<<< HEAD
|---|---|---|
| GET | `/signup` | Sign-up form |
| POST | `/signup` | Register a new user |
| GET | `/login` | Login form |
| POST | `/login` | Authenticate a user |
| GET | `/logout` | Log out the current user |

## 📌 Notes

- Prices are displayed in Indian Rupees (₹).
- Deleting a listing also deletes all of its associated reviews.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to open a pull request or file an issue.

## 📄 License

This project is licensed under the ISC License.
=======
| --- | --- | --- |
| GET | `/listings` | Browse listings |
| POST | `/listings` | Create a listing (authenticated) |
| GET | `/listings/:id` | View a listing and reviews |
| PUT / DELETE | `/listings/:id` | Update or delete the owner’s listing |
| POST | `/listings/:id/reviews` | Create a review (authenticated) |
| DELETE | `/listings/:id/reviews/:reviewId` | Delete the review author’s review |
>>>>>>> 8b4b964 (harden app for production)
