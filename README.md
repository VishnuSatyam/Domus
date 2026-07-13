# 🏡 Domus

Domus (Latin for "home") is a full-stack web application that connects travelers with unique accommodations through property listings, reviews, and an intuitive booking-inspired experience.

## ✨ Features

- **Browse listings** — view all available stays in a responsive card grid
- **View details** — see full information for a single listing, including price, location, and country
- **Create listings** — add a new place to stay with title, description, image, price, and location
- **Edit listings** — update any existing listing's details
- **Delete listings** — remove a listing you no longer want to offer
- **Server-side validation** — listing data is validated with Joi before it touches the database
- **Custom error handling** — friendly error pages for invalid requests and missing listings

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Server framework | [Express](https://expressjs.com/) 5 |
| Database | MongoDB (via [Mongoose](https://mongoosejs.com/)) |
| Templating | [EJS](https://ejs.co/) + [ejs-mate](https://www.npmjs.com/package/ejs-mate) for layouts |
| Validation | [Joi](https://joi.dev/) |
| Styling | Bootstrap + custom CSS |
| Misc | [method-override](https://www.npmjs.com/package/method-override) for PUT/DELETE from HTML forms |

## 📂 Project Structure

```
Domus/
├── app.js                  # Main Express app & route definitions
├── schema.js               # Joi validation schema for listings
├── models/
│   └── listing.js          # Mongoose Listing model
├── init/
│   ├── data.js             # Sample seed data
│   └── index.js            # Script to seed the database
├── utils/
│   └── ExpressError.js     # Custom error class
├── views/
│   ├── layouts/            # Shared page layout (boilerplate)
│   ├── includes/           # Navbar & footer partials
│   ├── listings/           # Index, show, new, edit templates
│   └── error.ejs           # Error page template
└── public/
    ├── CSS/                # Custom stylesheet
    └── js/                 # Client-side script
```

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) running locally on the default port (`27017`)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/VishnuSatyam/Domus.git
   cd Domus
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Make sure MongoDB is running locally, then seed the database with sample listings
   ```bash
   node init/index.js
   ```

4. Start the server
   ```bash
   node app.js
   ```

5. Open your browser and visit
   ```
   http://localhost:8080/listings
   ```

## 🗺️ Routes

| Method | Route | Description |
|---|---|---|
| GET | `/listings` | View all listings |
| GET | `/listings/new` | Form to create a new listing |
| POST | `/listings` | Create a new listing |
| GET | `/listings/:id` | View a single listing |
| GET | `/listings/:id/edit` | Form to edit a listing |
| PUT | `/listings/:id` | Update a listing |
| DELETE | `/listings/:id` | Delete a listing |

## 📌 Notes

- The app connects to a local MongoDB database named `wanderlust` — update the connection string in `app.js` and `init/index.js` if your setup differs.
- Prices are displayed in Indian Rupees (₹).

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to open a pull request or file an issue.

## 📄 License

This project is licensed under the ISC License.