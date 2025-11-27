const express = require("express");
const rateLimit = require("express-rate-limit");
const { register, login } = require("../controller/authController");

const router = express.Router();

// --- SECURITY: Rate Limiter ---
// This prevents hackers from spamming the login route
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    message:
      "Too many attempts from this IP, please try again after 15 minutes",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// --- ROUTES ---

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", authLimiter, register);


// @route   POST /api/auth/login
// @desc    Login user & get token
// @access  Public
router.post("/login", authLimiter, login);

module.exports = router;
