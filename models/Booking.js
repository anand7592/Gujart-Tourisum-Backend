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

const bookingSchema = new Schema(
  {
    // References
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    hotel: {
      type: Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true
    },

    // Booking Dates
    checkInDate: {
      type: Date,
      required: true,
      validate: {
        validator: function(value) {
          return value >= new Date();
        },
        message: "Check-in date must be in the future"
      }
    },
    checkOutDate: {
      type: Date,
      required: true,
      validate: {
        validator: function(value) {
          return value > this.checkInDate;
        },
        message: "Check-out date must be after check-in date"
      }
    },
    numberOfNights: {
      type: Number,
      required: true,
      min: [1, "Number of nights must be at least 1"]
    },

    // Room Details
    roomType: {
      type: String,
      required: true,
      trim: true,
      set: sanitize
    },
    numberOfRooms: {
      type: Number,
      required: true,
      min: [1, "Number of rooms must be at least 1"],
      max: [10, "Maximum 10 rooms per booking"]
    },

    // Guest Information
    guestName: {
      type: String,
      required: true,
      trim: true,
      set: sanitize,
      validate: {
        validator: function(value) {
          return /^[a-zA-Z\s]+$/.test(value);
        },
        message: "Guest name can only contain letters and spaces"
      }
    },
    guestEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: validator.isEmail,
        message: "Please provide a valid email address"
      }
    },
    guestPhone: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function(value) {
          return /^[+]?[\d\s\-\(\)]+$/.test(value);
        },
        message: "Please provide a valid phone number"
      }
    },
    numberOfGuests: {
      type: Number,
      required: true,
      min: [1, "Number of guests must be at least 1"],
      max: [20, "Maximum 20 guests per booking"]
    },
    specialRequests: {
      type: String,
      default: "",
      trim: true,
      maxlength: [500, "Special requests cannot exceed 500 characters"],
      set: sanitize
    },

    // Pricing
    pricePerNight: {
      type: Number,
      required: true,
      min: [0, "Price per night cannot be negative"]
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Total amount cannot be negative"]
    },
    taxAmount: {
      type: Number,
      required: true,
      min: [0, "Tax amount cannot be negative"],
      default: 0
    },
    finalAmount: {
      type: Number,
      required: true,
      min: [0, "Final amount cannot be negative"]
    },

    // Payment Information
    paymentStatus: {
      type: String,
      enum: {
        values: ["Pending", "Paid", "Failed", "Refunded"],
        message: "{VALUE} is not a valid payment status"
      },
      default: "Pending",
      index: true
    },
    paymentMethod: {
      type: String,
      required: true,
      trim: true,
      set: sanitize
    },
    razorpayOrderId: {
      type: String,
      trim: true,
      sparse: true // Allows multiple documents with null/undefined values
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
      sparse: true
    },

    // Booking Status
    bookingStatus: {
      type: String,
      enum: {
        values: ["Confirmed", "Pending", "Cancelled", "Completed"],
        message: "{VALUE} is not a valid booking status"
      },
      default: "Pending",
      index: true
    },

    // Cancellation Details
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [500, "Cancellation reason cannot exceed 500 characters"],
      set: sanitize
    },
    cancelledAt: {
      type: Date
    },
    refundAmount: {
      type: Number,
      min: [0, "Refund amount cannot be negative"]
    }
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
bookingSchema.index({ user: 1, createdAt: -1 }); // User's bookings
bookingSchema.index({ hotel: 1, checkInDate: 1 }); // Hotel availability
bookingSchema.index({ bookingStatus: 1, paymentStatus: 1 }); // Filter by status
bookingSchema.index({ checkInDate: 1, checkOutDate: 1 }); // Date range queries
bookingSchema.index({ razorpayOrderId: 1 }); // Payment verification
bookingSchema.index({ createdAt: -1 }); // Sort by newest


// Virtual for booking duration in days
bookingSchema.virtual('durationInDays').get(function() {
  if (this.checkInDate && this.checkOutDate) {
    const diffTime = Math.abs(this.checkOutDate - this.checkInDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Pre-save middleware - combined for better performance
bookingSchema.pre('save', function() {
  // Calculate numberOfNights
  if (this.checkInDate && this.checkOutDate) {
    const diffTime = Math.abs(this.checkOutDate - this.checkInDate);
    this.numberOfNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  // Calculate final amount if not provided
  if (!this.finalAmount) {
    this.finalAmount = this.totalAmount + (this.taxAmount || 0);
  }
  
  // Handle cancellation timestamp
  if (this.bookingStatus === 'Cancelled' && !this.cancelledAt) {
    this.cancelledAt = new Date();
  }
});

// Instance method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const checkIn = new Date(this.checkInDate);
  const hoursUntilCheckIn = (checkIn - now) / (1000 * 60 * 60);
  
  return this.bookingStatus !== 'Cancelled' && 
         this.bookingStatus !== 'Completed' && 
         hoursUntilCheckIn > 24; // Can cancel up to 24 hours before check-in
};

// Instance method to calculate refund amount
bookingSchema.methods.calculateRefund = function() {
  if (!this.canBeCancelled()) return 0;
  
  const now = new Date();
  const checkIn = new Date(this.checkInDate);
  const hoursUntilCheckIn = (checkIn - now) / (1000 * 60 * 60);
  
  if (hoursUntilCheckIn > 48) {
    return this.finalAmount; // Full refund
  } else if (hoursUntilCheckIn > 24) {
    return this.finalAmount * 0.5; // 50% refund
  }
  return 0; // No refund
};

// Static method to find bookings by date range
bookingSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    $or: [
      {
        checkInDate: {
          $gte: startDate,
          $lte: endDate
        }
      },
      {
        checkOutDate: {
          $gte: startDate,
          $lte: endDate
        }
      },
      {
        checkInDate: { $lte: startDate },
        checkOutDate: { $gte: endDate }
      }
    ]
  });
};

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
