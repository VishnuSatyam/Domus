# Domus

Domus (Latin for "home") is a full-stack property rental platform built with Node.js, Express, and MongoDB. Users can sign up, list homes, experiences, or services for rent, upload images, browse and search listings, and leave star-rated reviews — with full authentication and ownership-based authorization protecting who can edit or delete what.

## Features

- **User authentication** — sign up, log in, and log out with secure session-based auth (Passport.js + passport-local-mongoose)
- **Authorization** — only a listing's owner can edit or delete it; only a review's author can delete it; protected routes redirect anonymous users to log in first (and return them to where they started afterward)
- **Browse & search listings** — view all available stays in a responsive card grid, filter by category (Homes, Experiences, Services), and search by destination
- **View details** — see full information for a single listing, including price, location, country, and reviews
- **Create, edit & delete listings** — logged-in users can list a place with a title, description, image, price, location, and category, and manage listings they own
- **Image upload** — listing photos are uploaded via Multer and stored on Cloudinary, not the local filesystem; uncommitted uploads are cleaned up automatically if a request fails
- **Reviews & ratings** — logged-in users can leave a star rating (1–5) and comment on a listing; deleting a listing cleans up its associated reviews automatically
- **Server-side validation** — listing and review data is validated with Joi before it touches the database, and Mongoose enforces schema-level integrity underneath
- **Flash messages** — success/error feedback after actions like login, signup, or CRUD operations
- **Custom error handling** — a centralized error handler and friendly error page for invalid IDs, validation failures, upload errors, missing listings, and unmatched routes

## Production hardening

- Sessions are stored in MongoDB via `connect-mongo`, are never created for anonymous visitors, and use `httpOnly`, `sameSite=lax`, and production-only `secure` cookies.
- `owner` and `reviews` are never accepted from the browser — listing updates load the existing document, apply only the whitelisted fields, then validate and save.
- New Cloudinary uploads store both a URL and a public ID. Replacing or deleting a listing's image cleans up only assets in the `domus_DEV` folder, and a failed Cloudinary cleanup is surfaced as an error rather than silently ignored.
- Indexes support current filtering and ownership queries: `owner`, `location`, `country`, and `category` on listings; `author` on reviews.
- Missing configuration fails fast: the app refuses to start without `ATLASDB_URL` and a session secret, instead of running with insecure defaults.

## Tech stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (v24+) |
| Server framework | [Express](https://expressjs.com/) 5 |
| Database | MongoDB Atlas (via [Mongoose](https://mongoosejs.com/)) |
| Templating | [EJS](https://ejs.co/) + [ejs-mate](https://www.npmjs.com/package/ejs-mate) for layouts |
| Auth | [Passport.js](https://www.passportjs.org/) (local strategy) + [passport-local-mongoose](https://www.npmjs.com/package/passport-local-mongoose) |
| Sessions | [express-session](https://www.npmjs.com/package/express-session) with [connect-mongo](https://www.npmjs.com/package/connect-mongo) session store |
| Image storage | [Cloudinary](https://cloudinary.com/) via [Multer](https://www.npmjs.com/package/multer) + [multer-storage-cloudinary](https://www.npmjs.com/package/multer-storage-cloudinary) |
| Validation | [Joi](https://joi.dev/) |
| Styling | Bootstrap + custom CSS |
| Testing | Node's built-in test runner + [supertest](https://www.npmjs.com/package/supertest) + [mongodb-memory-server](https://www.npmjs.com/package/mongodb-memory-server) |
| Misc | [method-override](https://www.npmjs.com/package/method-override) for PUT/DELETE from HTML forms, [connect-flash](https://www.npmjs.com/package/connect-flash) for flash messages |

## 📂 Project structure

```
Domus/
├── app.js                       # Express app setup, sessions, auth, error handling & route mounting
├── schema.js                    # Joi validation schemas for listings & reviews
├── middleware.js                # Auth & ownership middleware (isLoggedIn, isOwner, isReviewAuthor)
├── cloudconfig.js               # Cloudinary + Multer storage configuration
├── controllers/
│   ├── listing.js               # Listing CRUD & search/category filtering logic
│   ├── reviews.js               # Review create/delete logic
│   └── users.js                 # Signup/login/logout logic
├── models/
│   ├── listing.js               # Mongoose Listing model (title, price, location, category, owner, reviews)
│   ├── review.js                # Mongoose Review model
│   └── user.js                  # Mongoose User model (passport-local-mongoose)
├── routes/
│   ├── listing.js               # Listing routes
│   ├── review.js                # Review routes
│   └── user.js                  # Auth routes
├── init/
│   ├── data.js                  # Sample seed data
│   └── index.js                 # Script to seed the database for an existing user
├── utils/
│   ├── config.js                # Env/config loading, DNS override, required-value guards
│   ├── cloudinary.js            # Cloudinary upload/delete helpers
│   ├── ExpressError.js          # Custom error class
│   └── backfillListingOwners.js # One-off migration script to backfill owner field on legacy listings
├── test/
│   └── app.test.js              # Route tests against an in-memory MongoDB instance
├── views/
│   ├── layouts/                 # Shared page layout (boilerplate)
│   ├── includes/                # Navbar (category filters + search) & footer partials
│   ├── listings/                # Index, show, new, edit templates
│   ├── users/                   # Signup & login templates
│   └── error.ejs                # Error page template
└── public/
    ├── css/                     # Custom stylesheets
    └── js/                      # Client-side form validation script
```

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v24+
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (or a local MongoDB instance)
- A free [Cloudinary](https://cloudinary.com/) account (for image uploads)

### Installation

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/VishnuSatyam/Domus.git
   cd Domus
   npm install
   ```

2. Create a `.env` file in the project root (never commit it) with the following variables:
   ```env
   ATLASDB_URL=mongodb://127.0.0.1:27017/domus
   SESSION_SECRET=replace-with-a-long-random-secret
   CLOUD_NAME=...
   CLOUD_API_KEY=...
   CLOUD_API_SECRET=...
   NODE_ENV=development
   # Optional: use explicit resolvers when mongodb+srv DNS is blocked locally
   DNS_SERVERS=1.1.1.1,8.8.8.8
   ```
   `SECRET` remains supported as a legacy session-secret name, but `SESSION_SECRET` is preferred. In production, set `NODE_ENV=production` and serve the app over HTTPS so secure session cookies work correctly.

3. (Optional) Seed the database with sample listings. Sign up a user first, then run:
   ```bash
   SEED_OWNER_USERNAME=your-username node init/index.js
   ```

4. Start the app:
   ```bash
   npm start
   ```

5. Visit `http://localhost:8080/listings`.

## Tests

```bash
npm test
npm run test:watch
```

The route tests use `mongodb-memory-server`, which spins up a temporary, isolated database — they never touch your configured `ATLASDB_URL` or a real Cloudinary account (Cloudinary deletion is mocked for the image-replacement test).

## Maintenance scripts

The historical owner-backfill migration is retained for databases created before listings had a required `owner` field. It uses `ATLASDB_URL` and refuses to run unless explicitly confirmed:

```bash
CONFIRM_LISTING_OWNER_BACKFILL=true node utils/backfillListingOwners.js
```

It assigns ownerless listings to the first existing user, so inspect the target database and back it up before running it.

## Routes

### Listings

| Method | Route | Description | Auth required |
|---|---|---|---|
| GET | `/listings` | Browse listings (supports `where`, `category`, `startDate`, `endDate`, `guests` query params) | No |
| GET | `/listings/new` | Form to create a new listing | Yes |
| POST | `/listings` | Create a new listing | Yes |
| GET | `/listings/:id` | View a single listing and its reviews | No |
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
|---|---|---|
| GET | `/signup` | Sign-up form |
| POST | `/signup` | Register a new user |
| GET | `/login` | Login form |
| POST | `/login` | Authenticate a user |
| GET | `/logout` | Log out the current user |

## 📌 Notes

- Prices are displayed in Indian Rupees (₹).
- Listings belong to one of three categories — Home, Experience, or Service — filterable from the navbar; listings created before categories existed still appear under "Homes".
- Deleting a listing also deletes all of its associated reviews and its Cloudinary image.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to open a pull request or file an issue.

## 📄 License

This project is licensed under the ISC License.