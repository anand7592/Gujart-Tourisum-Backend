const mongoose = require("mongoose");
const validator = require("validator");

const { Schema } = mongoose;

// Sanitizer function for string fields
const sanitize = (value) => {
  if (typeof value === 'string') {
    return validator.escape(value);
  }
  return value;
};

// Package Itinerary Schema
const packageItinerarySchema = new Schema(
  {
    day: {
      type: Number,
      required: true,
      min: [1, "Day must be at least 1"]
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, "Day title cannot exceed 100 characters"],
      set: sanitize
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, "Day description cannot exceed 1000 characters"],
      set: sanitize
    },
    activities: [{
      type: String,
      trim: true,
      maxlength: [200, "Activity description cannot exceed 200 characters"],
      set: sanitize
    }],
    meals: {
      breakfast: { type: Boolean, default: false },
      lunch: { type: Boolean, default: false },
      dinner: { type: Boolean, default: false }
    },
    accommodation: {
      type: String,
      trim: true,
      maxlength: [200, "Accommodation details cannot exceed 200 characters"],
      set: sanitize
    }
  },
  { _id: false }
);

// Package Schema
const packageSchema = new Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, "Package name cannot exceed 100 characters"],
      set: sanitize,
      index: true
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
      set: sanitize
    },
    category: {
      type: String,
      required: true,
      enum: {
        values: ["Adventure", "Cultural", "Religious", "Nature", "Heritage", "Beach", "Wildlife", "Wellness"],
        message: "{VALUE} is not a valid package category"
      },
      index: true
    },
    difficulty: {
      type: String,
      required: true,
      enum: {
        values: ["Easy", "Moderate", "Hard"],
        message: "{VALUE} is not a valid difficulty level"
      }
    },

    // Duration and Pricing
    duration: {
      type: Number,
      required: true,
      min: [1, "Duration must be at least 1 day"],
      max: [30, "Duration cannot exceed 30 days"]
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"]
    },
    discountedPrice: {
      type: Number,
      min: [0, "Discounted price cannot be negative"],
      validate: {
        validator: function(value) {
          return !value || value < this.price;
        },
        message: "Discounted price must be less than original price"
      }
    },

    // Group Size
    groupSize: {
      min: {
        type: Number,
        required: true,
        min: [1, "Minimum group size must be at least 1"],
        max: [50, "Minimum group size cannot exceed 50"]
      },
      max: {
        type: Number,
        required: true,
        min: [1, "Maximum group size must be at least 1"],
        max: [100, "Maximum group size cannot exceed 100"],
        validate: {
          validator: function(value) {
            return value >= this.groupSize.min;
          },
          message: "Maximum group size must be greater than or equal to minimum group size"
        }
      }
    },

    // Dates
    startDate: {
      type: Date,
      required: true,
      validate: {
        validator: function(value) {
          return value >= new Date();
        },
        message: "Start date must be in the future"
      }
    },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function(value) {
          return value > this.startDate;
        },
        message: "End date must be after start date"
      }
    },

    // References
    places: [{
      type: Schema.Types.ObjectId,
      ref: "Place",
      required: true
    }],
    hotels: [{
      type: Schema.Types.ObjectId,
      ref: "Hotel"
    }],

    // Itinerary
    itinerary: [packageItinerarySchema],

    // Package Details
    highlights: [{
      type: String,
      trim: true,
      maxlength: [200, "Highlight cannot exceed 200 characters"],
      set: sanitize
    }],
    included: [{
      type: String,
      trim: true,
      maxlength: [200, "Included item cannot exceed 200 characters"],
      set: sanitize
    }],
    excluded: [{
      type: String,
      trim: true,
      maxlength: [200, "Excluded item cannot exceed 200 characters"],
      set: sanitize
    }],

    // Media
    images: [{
      type: String,
      validate: {
        validator: function(value) {
          return validator.isURL(value);
        },
        message: "Please provide a valid image URL"
      }
    }],
    coverImage: {
      type: String,
      validate: {
        validator: function(value) {
          return !value || validator.isURL(value);
        },
        message: "Please provide a valid cover image URL"
      }
    },

    // Availability and Status
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    availableSlots: {
      type: Number,
      required: true,
      min: [0, "Available slots cannot be negative"],
      max: [1000, "Available slots cannot exceed 1000"]
    },
    bookedSlots: {
      type: Number,
      default: 0,
      min: [0, "Booked slots cannot be negative"]
    },

    // Policies
    cancellationPolicy: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, "Cancellation policy cannot exceed 1000 characters"],
      set: sanitize
    },
    termsConditions: {
      type: String,
      trim: true,
      maxlength: [2000, "Terms and conditions cannot exceed 2000 characters"],
      set: sanitize
    },

    // Ratings and Reviews
    rating: {
      type: Number,
      default: 0,
      min: [0, "Rating cannot be negative"],
      max: [5, "Rating cannot exceed 5"]
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: [0, "Review count cannot be negative"]
    },

    // Admin Fields
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
packageSchema.index({ name: 1 });
packageSchema.index({ category: 1, isActive: 1 });
packageSchema.index({ price: 1 });
packageSchema.index({ startDate: 1, endDate: 1 });
packageSchema.index({ createdAt: -1 });
packageSchema.index({ rating: -1 });

// Virtual for current effective price
packageSchema.virtual('effectivePrice').get(function() {
  return this.discountedPrice || this.price;
});

// Virtual for discount percentage
packageSchema.virtual('discountPercentage').get(function() {
  if (this.discountedPrice && this.price > 0) {
    return Math.round(((this.price - this.discountedPrice) / this.price) * 100);
  }
  return 0;
});

// Virtual for availability status
packageSchema.virtual('availabilityStatus').get(function() {
  const remaining = this.availableSlots - this.bookedSlots;
  if (remaining === 0) return 'Full';
  if (remaining <= 5) return 'Limited';
  return 'Available';
});

// Virtual for remaining slots
packageSchema.virtual('remainingSlots').get(function() {
  return Math.max(0, this.availableSlots - this.bookedSlots);
});

// Pre-save middleware
packageSchema.pre('save', function() {
  // Ensure end date is after start date
  if (this.endDate && this.startDate && this.endDate <= this.startDate) {
    throw new Error('End date must be after start date');
  }
  
  // Ensure discounted price is less than original price
  if (this.discountedPrice && this.discountedPrice >= this.price) {
    throw new Error('Discounted price must be less than original price');
  }
  
  // Ensure booked slots don't exceed available slots
  if (this.bookedSlots > this.availableSlots) {
    throw new Error('Booked slots cannot exceed available slots');
  }
  
  // Set cover image to first image if not provided
  if (!this.coverImage && this.images && this.images.length > 0) {
    this.coverImage = this.images[0];
  }
});

// Instance method to check if package is bookable
packageSchema.methods.isBookable = function(requestedSlots = 1) {
  const now = new Date();
  return this.isActive && 
         this.startDate > now &&
         this.remainingSlots >= requestedSlots;
};

// Instance method to book slots
packageSchema.methods.bookSlots = function(slots) {
  if (!this.isBookable(slots)) {
    throw new Error('Package is not available for booking');
  }
  
  this.bookedSlots += slots;
  return this.save();
};

// Instance method to cancel slots
packageSchema.methods.cancelSlots = function(slots) {
  this.bookedSlots = Math.max(0, this.bookedSlots - slots);
  return this.save();
};

// Static method to find available packages
packageSchema.statics.findAvailable = function(filters = {}) {
  const query = {
    isActive: true,
    startDate: { $gt: new Date() },
    ...filters
  };
  
  return this.find(query)
    .populate('places', 'name location images')
    .populate('hotels', 'name location rating')
    .sort({ startDate: 1 });
};

// Static method to find by category
packageSchema.statics.findByCategory = function(category, filters = {}) {
  return this.findAvailable({ category, ...filters });
};

// Static method to search packages
packageSchema.statics.searchPackages = function(searchTerm, filters = {}) {
  const searchQuery = {
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { category: { $regex: searchTerm, $options: 'i' } }
    ],
    ...filters
  };
  
  return this.findAvailable(searchQuery);
};

const Package = mongoose.model("Package", packageSchema);

module.exports = Package;