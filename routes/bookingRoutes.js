const express = require("express");
const router = express.Router();
const {
  getBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  updatePaymentStatus,
  cancelBooking,
  getBookingStats,
  getMyBookings,
  createRazorpayOrder,
  verifyRazorpayPayment,
  razorpayWebhook,
} = require("../controller/bookingController");
const { protect, admin } = require("../middleware/authMiddleware");

router.get("/", protect, getBookings);
router.get("/stats", protect, admin, getBookingStats);
router.get("/my-bookings", protect, getMyBookings);
router.get("/:id", protect, getBookingById);
router.post("/", protect, createBooking);
router.post("/:id/create-order", protect, createRazorpayOrder);
router.post("/verify-payment", protect, verifyRazorpayPayment);
router.post("/webhook", razorpayWebhook);
router.patch("/:id/status", protect, updateBookingStatus);
router.patch("/:id/payment", protect, updatePaymentStatus);
router.delete("/:id", protect, cancelBooking);

module.exports = router;