const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");
const User = require("../models/User");
const Razorpay = require("razorpay");
const crypto = require("crypto");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Get all bookings (Admin) or user's bookings (User)
// @route   GET /api/bookings
// @access  Private
exports.getBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, paymentStatus, hotelId } = req.query;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin;

    // Build query
    const query = {};
    
    // If not admin, only show user's bookings
    if (!isAdmin) {
      query.user = userId;
    }
    
    // Apply filters
    if (status) query.bookingStatus = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (hotelId) query.hotel = hotelId;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: "user", select: "firstName lastName email contactNo" },
        { path: "hotel", select: "name location contact images" }
      ]
    };

    const bookings = await Booking.find(query)
      .lean()
      .populate(options.populate)
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit)
      .exec();

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      bookings,
      pagination: {
        currentPage: options.page,
        totalPages: Math.ceil(total / options.limit),
        totalBookings: total,
        hasNext: options.page < Math.ceil(total / options.limit),
        hasPrev: options.page > 1
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking by ID
// @route   GET /api/bookings/:id
// @access  Private
exports.getBookingById = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin;

    const booking = await Booking.findById(bookingId)
      .populate("user", "firstName lastName email contactNo address")
      .populate("hotel", "name description location contact images amenities roomTypes");

    if (!booking) {
      res.status(404);
      throw new Error("Booking not found");
    }

    // Check if user can access this booking
    if (!isAdmin && booking.user._id.toString() !== userId) {
      res.status(403);
      throw new Error("Access denied. You can only view your own bookings");
    }

    res.status(200).json(booking);
  } catch (error) {
    next(error);
  }
};

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      hotel,
      checkInDate,
      checkOutDate,
      roomType,
      numberOfRooms,
      guestName,
      guestEmail,
      guestPhone,
      numberOfGuests,
      specialRequests,
      pricePerNight,
      paymentMethod
    } = req.body;

    // Validate required fields
    if (!hotel || !checkInDate || !checkOutDate || !roomType || !numberOfRooms || 
        !guestName || !guestEmail || !guestPhone || !numberOfGuests || !pricePerNight) {
      res.status(400);
      throw new Error("All required fields must be provided");
    }

    // Validate hotel exists
    const hotelExists = await Hotel.findById(hotel);
    if (!hotelExists) {
      res.status(404);
      throw new Error("Hotel not found");
    }

    // Validate dates
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const now = new Date();

    if (checkIn < now) {
      res.status(400);
      throw new Error("Check-in date must be in the future");
    }

    if (checkOut <= checkIn) {
      res.status(400);
      throw new Error("Check-out date must be after check-in date");
    }

    // Calculate booking details
    const diffTime = Math.abs(checkOut - checkIn);
    const numberOfNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalAmount = pricePerNight * numberOfNights * numberOfRooms;
    const taxAmount = totalAmount * 0.18; // 18% GST
    const finalAmount = totalAmount + taxAmount;

    // Check room availability (basic check - you might want to implement more sophisticated logic)
    const existingBookings = await Booking.find({
      hotel,
      roomType,
      bookingStatus: { $in: ["Confirmed", "Pending"] },
      $or: [
        {
          checkInDate: { $gte: checkIn, $lt: checkOut }
        },
        {
          checkOutDate: { $gt: checkIn, $lte: checkOut }
        },
        {
          checkInDate: { $lte: checkIn },
          checkOutDate: { $gte: checkOut }
        }
      ]
    });

    const bookedRooms = existingBookings.reduce((sum, booking) => sum + booking.numberOfRooms, 0);
    // Assuming hotel has sufficient rooms (you should add room inventory to Hotel model)
    const availableRooms = 10; // This should come from hotel's room inventory
    
    if (bookedRooms + numberOfRooms > availableRooms) {
      res.status(400);
      throw new Error(`Only ${availableRooms - bookedRooms} rooms available for selected dates`);
    }

    // Create booking
    const booking = await Booking.create({
      user: userId,
      hotel,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfNights,
      roomType,
      numberOfRooms,
      guestName,
      guestEmail,
      guestPhone,
      numberOfGuests,
      specialRequests: specialRequests || "",
      pricePerNight,
      totalAmount,
      taxAmount,
      finalAmount,
      paymentMethod,
      paymentStatus: "Pending",
      bookingStatus: "Pending"
    });

    // Populate the created booking
    const populatedBooking = await Booking.findById(booking._id)
      .populate("user", "firstName lastName email")
      .populate("hotel", "name location contact");

    res.status(201).json({
      message: "Booking created successfully",
      booking: populatedBooking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking status
// @route   PATCH /api/bookings/:id/status
// @access  Private (Admin or booking owner)
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin;
    const { bookingStatus, cancellationReason } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      res.status(404);
      throw new Error("Booking not found");
    }

    // Check permissions
    if (!isAdmin && booking.user.toString() !== userId) {
      res.status(403);
      throw new Error("Access denied");
    }

    // Validate status transition
    const validStatuses = ["Confirmed", "Pending", "Cancelled", "Completed"];
    if (!validStatuses.includes(bookingStatus)) {
      res.status(400);
      throw new Error("Invalid booking status");
    }

    // Handle cancellation
    if (bookingStatus === "Cancelled") {
      if (!booking.canBeCancelled()) {
        res.status(400);
        throw new Error("Booking cannot be cancelled at this time");
      }
      
      if (!cancellationReason) {
        res.status(400);
        throw new Error("Cancellation reason is required");
      }

      booking.cancellationReason = cancellationReason;
      booking.cancelledAt = new Date();
      booking.refundAmount = booking.calculateRefund();
    }

    booking.bookingStatus = bookingStatus;
    await booking.save();

    res.status(200).json({
      message: "Booking status updated successfully",
      booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update payment status
// @route   PATCH /api/bookings/:id/payment
// @access  Private (Admin or booking owner)
exports.updatePaymentStatus = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin;
    const { paymentStatus, razorpayOrderId, razorpayPaymentId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      res.status(404);
      throw new Error("Booking not found");
    }

    // Check permissions
    if (!isAdmin && booking.user.toString() !== userId) {
      res.status(403);
      throw new Error("Access denied");
    }

    // Validate payment status
    const validPaymentStatuses = ["Pending", "Paid", "Failed", "Refunded"];
    if (!validPaymentStatuses.includes(paymentStatus)) {
      res.status(400);
      throw new Error("Invalid payment status");
    }

    // Update payment details
    booking.paymentStatus = paymentStatus;
    if (razorpayOrderId) booking.razorpayOrderId = razorpayOrderId;
    if (razorpayPaymentId) booking.razorpayPaymentId = razorpayPaymentId;

    // Auto-confirm booking if payment is successful
    if (paymentStatus === "Paid" && booking.bookingStatus === "Pending") {
      booking.bookingStatus = "Confirmed";
    }

    await booking.save();

    res.status(200).json({
      message: "Payment status updated successfully",
      booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel booking
// @route   DELETE /api/bookings/:id
// @access  Private (Admin or booking owner)
exports.cancelBooking = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin;
    const { cancellationReason } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      res.status(404);
      throw new Error("Booking not found");
    }

    // Check permissions
    if (!isAdmin && booking.user.toString() !== userId) {
      res.status(403);
      throw new Error("Access denied");
    }

    // Check if booking can be cancelled
    if (!booking.canBeCancelled()) {
      res.status(400);
      throw new Error("Booking cannot be cancelled at this time. Must be cancelled at least 24 hours before check-in.");
    }

    if (!cancellationReason) {
      res.status(400);
      throw new Error("Cancellation reason is required");
    }

    // Update booking
    booking.bookingStatus = "Cancelled";
    booking.cancellationReason = cancellationReason;
    booking.cancelledAt = new Date();
    booking.refundAmount = booking.calculateRefund();
    
    await booking.save();

    res.status(200).json({
      message: "Booking cancelled successfully",
      refundAmount: booking.refundAmount,
      booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get booking statistics (Admin only)
// @route   GET /api/bookings/stats
// @access  Private/Admin
exports.getBookingStats = async (req, res, next) => {
  try {
    if (!req.user.isAdmin) {
      res.status(403);
      throw new Error("Access denied. Admin only.");
    }

    const { startDate, endDate } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get various statistics
    const totalBookings = await Booking.countDocuments(dateFilter);
    const confirmedBookings = await Booking.countDocuments({
      ...dateFilter,
      bookingStatus: "Confirmed"
    });
    const cancelledBookings = await Booking.countDocuments({
      ...dateFilter,
      bookingStatus: "Cancelled"
    });
    const completedBookings = await Booking.countDocuments({
      ...dateFilter,
      bookingStatus: "Completed"
    });

    // Revenue statistics
    const revenueStats = await Booking.aggregate([
      { $match: { ...dateFilter, paymentStatus: "Paid" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$finalAmount" },
          averageBookingValue: { $avg: "$finalAmount" },
          totalRefunds: { $sum: "$refundAmount" }
        }
      }
    ]);

    // Monthly booking trends
    const monthlyStats = await Booking.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "Paid"] }, "$finalAmount", 0]
            }
          }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    res.status(200).json({
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      completedBookings,
      revenue: revenueStats[0] || {
        totalRevenue: 0,
        averageBookingValue: 0,
        totalRefunds: 0
      },
      monthlyTrends: monthlyStats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's booking history
// @route   GET /api/bookings/my-bookings
// @access  Private
exports.getMyBookings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { user: userId };
    if (status) query.bookingStatus = status;

    const bookings = await Booking.find(query)
      .populate("hotel", "name location images contact")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalBookings: total
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Razorpay order for booking
// @route   POST /api/bookings/:id/create-order
// @access  Private
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;

    console.log('🎯 Creating Razorpay order for booking:', bookingId);
    console.log('🔧 Razorpay keys check:', {
      keyId: process.env.RAZORPAY_KEY_ID ? 'LOADED' : 'MISSING',
      keySecret: process.env.RAZORPAY_KEY_SECRET ? 'LOADED' : 'MISSING'
    });

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      res.status(404);
      throw new Error("Booking not found");
    }

    console.log('📋 Booking found:', {
      id: booking._id,
      finalAmount: booking.finalAmount,
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.bookingStatus
    });

    // Check if user owns this booking
    if (booking.user.toString() !== userId) {
      res.status(403);
      throw new Error("Access denied. You can only pay for your own bookings");
    }

    // Check if booking is already paid
    if (booking.paymentStatus === "Paid") {
      res.status(400);
      throw new Error("Booking is already paid");
    }

    // Check if booking is cancelled
    if (booking.bookingStatus === "Cancelled") {
      res.status(400);
      throw new Error("Cannot pay for cancelled booking");
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(booking.finalAmount * 100), // Amount in paise
      currency: "INR",
      receipt: `booking_${bookingId}`,
      notes: {
        bookingId: bookingId.toString(),
        userId: userId.toString(),
        hotelName: booking.hotel.toString(),
      },
    };

    const order = await razorpay.orders.create(options);

    // Save Razorpay order ID to booking
    booking.razorpayOrderId = order.id;
    await booking.save();

    res.status(200).json({
      message: "Razorpay order created successfully",
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      booking: {
        id: booking._id,
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        guestPhone: booking.guestPhone,
        finalAmount: booking.finalAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay payment
// @route   POST /api/bookings/verify-payment
// @access  Private
exports.verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user.id;

    // Verify required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400);
      throw new Error("Missing payment verification details");
    }

    // Find booking by Razorpay order ID
    const booking = await Booking.findOne({ razorpayOrderId: razorpay_order_id });
    if (!booking) {
      res.status(404);
      throw new Error("Booking not found for this order");
    }

    // Check if user owns this booking
    if (booking.user.toString() !== userId) {
      res.status(403);
      throw new Error("Access denied");
    }

    // Verify payment signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      res.status(400);
      throw new Error("Invalid payment signature");
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (payment.status === "captured") {
      // Update booking with payment details
      booking.razorpayPaymentId = razorpay_payment_id;
      booking.paymentStatus = "Paid";
      booking.bookingStatus = "Confirmed";
      await booking.save();

      // Populate booking for response
      const populatedBooking = await Booking.findById(booking._id)
        .populate("user", "firstName lastName email")
        .populate("hotel", "name location contact");

      res.status(200).json({
        message: "Payment verified successfully",
        booking: populatedBooking,
        paymentDetails: {
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          amount: payment.amount / 100, // Convert from paise to rupees
          status: payment.status,
          method: payment.method,
        },
      });
    } else {
      // Payment failed
      booking.paymentStatus = "Failed";
      await booking.save();

      res.status(400);
      throw new Error("Payment verification failed");
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Handle Razorpay webhook (optional for additional security)
// @route   POST /api/bookings/webhook
// @access  Public (but secured with signature verification)
exports.razorpayWebhook = async (req, res, next) => {
  try {
    const webhookSignature = req.headers["x-razorpay-signature"];
    const webhookBody = JSON.stringify(req.body);

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET)
      .update(webhookBody)
      .digest("hex");

    if (webhookSignature !== expectedSignature) {
      return res.status(400).json({ message: "Invalid webhook signature" });
    }

    const event = req.body;

    // Handle different webhook events
    switch (event.event) {
      case "payment.captured":
        const paymentId = event.payload.payment.entity.id;
        const orderId = event.payload.payment.entity.order_id;

        const booking = await Booking.findOne({ razorpayOrderId: orderId });
        if (booking && booking.paymentStatus !== "Paid") {
          booking.razorpayPaymentId = paymentId;
          booking.paymentStatus = "Paid";
          booking.bookingStatus = "Confirmed";
          await booking.save();
        }
        break;

      case "payment.failed":
        const failedOrderId = event.payload.payment.entity.order_id;
        const failedBooking = await Booking.findOne({ razorpayOrderId: failedOrderId });
        if (failedBooking) {
          failedBooking.paymentStatus = "Failed";
          await failedBooking.save();
        }
        break;

      default:
        console.log(`Unhandled webhook event: ${event.event}`);
    }

    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ message: "Webhook processing failed" });
  }
};
