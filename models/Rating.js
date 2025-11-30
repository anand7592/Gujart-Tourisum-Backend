const mongoose = require("mongoose");
const sanitize = require("mongo-sanitize");

const ratingSchema = new mongoose.Schema(
  {
    // User who gave the rating
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // What is being rated (Hotel, Place, or SubPlace)
    ratingType: {
      type: String,
      enum: ["Hotel", "Place", "SubPlace"],
      required: true,
    },
    
    // Reference to the rated item
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel" },
    place: { type: mongoose.Schema.Types.ObjectId, ref: "Place" },
    subPlace: { type: mongoose.Schema.Types.ObjectId, ref: "SubPlace" },
    
    // Rating (1-5 stars)
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    
    // Review Details
    title: { type: String, required: true },
    comment: { type: String, required: true },
    
    // Additional Ratings (for hotels)
    cleanliness: { type: Number, min: 1, max: 5 },
    service: { type: Number, min: 1, max: 5 },
    location: { type: Number, min: 1, max: 5 },
    valueForMoney: { type: Number, min: 1, max: 5 },
    
    // Images uploaded by user
    images: [{ type: String }],
    
    // Helpful votes
    helpfulCount: { type: Number, default: 0 },
    
    // Status
    isApproved: { type: Boolean, default: true },
    isReported: { type: Boolean, default: false },
    
    // Admin Response
    adminResponse: { type: String, default: "" },
  },
  { timestamps: true }
);

// Middleware: Sanitize data before saving
ratingSchema.pre("save", function () {
  this.title = sanitize(this.title);
  this.comment = sanitize(this.comment);
});

// Update hotel/place average rating after new review
ratingSchema.post("save", async function () {
  const Rating = this.constructor;
  
  if (this.ratingType === "Hotel" && this.hotel) {
    const Hotel = mongoose.model("Hotel");
    const stats = await Rating.aggregate([
      { $match: { hotel: this.hotel, isApproved: true } },
      {
        $group: {
          _id: "$hotel",
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);
    
    if (stats.length > 0) {
      await Hotel.findByIdAndUpdate(this.hotel, {
        averageRating: Math.round(stats[0].avgRating * 10) / 10,
        totalReviews: stats[0].totalReviews,
      });
    }
  }
});

module.exports = mongoose.model("Rating", ratingSchema);