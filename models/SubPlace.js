const mongoose = require("mongoose");
const sanitize = require("mongo-sanitize");

const subPlaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    
    // Link to parent Place
    place: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Place",
      required: true,
    },
    
    location: { type: String, required: true },
    image: { type: String, default: "" },
    entryFee: { type: Number, default: 0 },
    
    // Timing information
    openTime: { type: String, default: "9:00 AM" },
    closeTime: { type: String, default: "6:00 PM" },
    
    // Best time to visit
    bestTimeToVisit: { type: String, default: "" },
    
    // Additional features
    features: [{ type: String }], // ["Parking", "Restaurant", "Guide Available"]
    
    // Link to the Admin who created it
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Middleware: Sanitize data before saving
subPlaceSchema.pre("save", function () {
  this.name = sanitize(this.name);
  this.description = sanitize(this.description);
  this.location = sanitize(this.location);
});

module.exports = mongoose.model("SubPlace", subPlaceSchema);