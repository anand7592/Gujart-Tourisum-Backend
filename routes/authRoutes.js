const express = require("express");
const rateLimit = require("express-rate-limit");
const { register, login, logout, getMe } = require("../controller/authController");

const { protect } = require("../middleware/authMiddleware"); 

const router = express.Router();

// Rate Limiter (Optional, but good to keep if you added it earlier)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: { message: "Too many attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- ROUTES ---

// Public Routes
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);

// Protected Routes
// We changed logout to GET so it's easier to call from frontend
router.get("/logout", logout); 

// This was the line causing the error
router.get("/me", protect, getMe); 

module.exports = router;