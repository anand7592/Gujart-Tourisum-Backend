const mongoose = require("mongoose");
const sanitize = require("mongo-sanitize");

const placeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    image: { type: String, default: "" }, // Stores URL string
    price: { type: Number, default: 0 },  // Entry fee or package cost
    
    // Link to the Admin who created it (Audit trail)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Middleware: Sanitize data before saving (Extra Security Layer)
placeSchema.pre("save", function () {
  this.name = sanitize(this.name);
  this.description = sanitize(this.description);
  this.location = sanitize(this.location);
});

module.exports = mongoose.model("Place", placeSchema);