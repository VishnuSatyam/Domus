const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 120,
    },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    image:{
        url: { type: String, required: true },
        filename: String,
        publicId: String,
    },
    price: { type: Number, required: true, min: 0, max: 10000000 },
    location: { type: String, required: true, trim: true, minlength: 2, maxlength: 150, index: true },
    country: { type: String, required: true, trim: true, minlength: 2, maxlength: 100, index: true },
    category: {
        type: String,
        enum: ["home", "experience", "service"],
        default: "home",
        required: true,
        index: true,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    reviews: [{
        type: Schema.Types.ObjectId,
        ref: "Review",
    }]
});

const Listing = mongoose.model("Listing" , listingSchema);
module.exports = Listing;
