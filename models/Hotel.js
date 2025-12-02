const mongoose = require("mongoose");
const sanitize = require("mongo-sanitize");

const { Schema } = mongoose;

// Optional: RoomType sub-schema (based on your RoomType[] usage)
const roomTypeSchema = new Schema(
  {
    name: { type: String, required: true }, // e.g., "Deluxe Room", "Suite"
    description: { type: String, default: "" },
    maxGuests: { type: Number, default: 2 },
    bedType: { type: String, default: "" }, // e.g., "King", "Twin"
    pricePerNight: { type: Number, default: 0 },
    amenities: [{ type: String }], // room-level amenities
  },
  { _id: false } // no separate _id for each roomType
);

const hotelSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },

    // Link to Place (city/area/tourist place)
    place: {
      type: Schema.Types.ObjectId,
      ref: "Place",
      required: true,
    },

    location: { type: String, required: true }, // e.g. city/area name
    address: { type: String, required: true },

    contactNo: { type: String, required: true },
    email: { type: String, default: "" },
    website: { type: String, default: "" },

    images: [{ type: String, default: "" }],

    pricePerNight: { type: Number, required: true, default: 0 },

    category: {
      type: String,
      enum: ["Budget", "Mid-Range", "Luxury", "Resort", "Boutique"],
      required: true,
    },

    amenities: [{ type: String }], // e.g. ["WiFi", "Parking", "Pool"]

    roomTypes: [roomTypeSchema],

    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },

    // Link to Admin/User who created it
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true } // createdAt, updatedAt
);

// CRITICAL INDEXES FOR PERFORMANCE
hotelSchema.index({ place: 1, isActive: 1 }); // Filter by place and active
hotelSchema.index({ category: 1 }); // Filter by category
hotelSchema.index({ pricePerNight: 1 }); // Sort/filter by price
hotelSchema.index({ averageRating: -1 }); // Sort by rating
hotelSchema.index({ location: 1 }); // Filter by location
hotelSchema.index({ createdAt: -1 }); // Sort by newest
hotelSchema.index({ name: 'text', description: 'text' }); // Full-text search

// Sanitize key string fields before saving
hotelSchema.pre("save", function () {
  this.name = sanitize(this.name);
  this.description = sanitize(this.description);
  this.location = sanitize(this.location);
  this.address = sanitize(this.address);
  this.contactNo = sanitize(this.contactNo);
  if (this.email) this.email = sanitize(this.email);
  if (this.website) this.website = sanitize(this.website);
});

module.exports = mongoose.model("Hotel", hotelSchema);
