const mongoose = require("mongoose");
const sanitize = require("mongo-sanitize");

const placeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    image: { type: String, default: "" }, // This line allows the image URL to be saved
    price: { type: Number, default: 0 }, // Entry fee or package cost

    // Link to the Admin who created it (Audit trail)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// ADD INDEXES FOR FASTER QUERIES
placeSchema.index({ name: 1 }); // Search by name
placeSchema.index({ location: 1 }); // Filter by location
placeSchema.index({ price: 1 }); // Sort/filter by price
placeSchema.index({ createdAt: -1 }); // Sort by newest
placeSchema.index({ name: 'text', description: 'text' }); // Full-text search

// Middleware: Sanitize data before saving (Extra Security Layer)
placeSchema.pre("save", function () {
  this.name = sanitize(this.name);
  this.description = sanitize(this.description);
  this.location = sanitize(this.location);
});

module.exports = mongoose.model("Place", placeSchema);
