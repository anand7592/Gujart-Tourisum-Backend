const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// Helper function to set cookie with token
const setTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === "production";
  
  const cookieOptions = {
    httpOnly: true, // Cannot be accessed via JavaScript (XSS protection)
    secure: isProduction, // Only HTTPS in production
    sameSite: isProduction ? "none" : "lax", // CRITICAL for cross-origin in production
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: "/", // Available on all routes
  };

  console.log("🍪 Setting cookie with options:", cookieOptions);
  res.cookie("token", token, cookieOptions);
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      email,
      address,
      contactNo,
      password,
    } = req.body;

    // 1. Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // 2. Create User
    const user = await User.create({
      firstName,
      middleName,
      lastName,
      email,
      address,
      contactNo,
      password,
      isAdmin: false,
    });

    // 3. Generate Token and set cookie
    const token = generateToken(user);
    setTokenCookie(res, token);

    // 4. Remove password from response
    const userData = user.toObject();
    delete userData.password;

    console.log("✅ User registered successfully:", userData.email);

    res.status(201).json({
      message: "User registered successfully",
      user: userData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log("🔐 Login attempt for:", email);

    // 1. Input Validation
    if (!email || !password) {
      return res.status(400).json({
        message: "Please provide both email and password",
      });
    }

    // 2. Find User (Explicitly select password)
    const user = await User.findOne({ email }).select("+password");

    // 3. Check User Existence AND Password Match
    if (!user || !(await user.matchPassword(password))) {
      console.log("❌ Invalid credentials for:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("✅ Password verified for:", email, "isAdmin:", user.isAdmin);

    // 4. Generate Token and set cookie
    const token = generateToken(user);
    setTokenCookie(res, token);

    // 5. Sanitize Output
    const userData = user.toObject();
    delete userData.password;

    console.log("✅ Login successful for:", email);
    console.log("📦 Sending user data:", { 
      id: userData._id, 
      email: userData.email, 
      isAdmin: userData.isAdmin 
    });

    // 6. Send Response
    res.status(200).json({
      message: "Login successful",
      user: userData,
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    next(error);
  }
};

// @desc    Logout user (Clear cookie)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";
  
  res.cookie("token", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    expires: new Date(0), // Expire immediately
    path: "/",
  });

  console.log("✅ User logged out");

  res.status(200).json({
    message: "Logged out successfully",
  });
};

// @desc    Get current user (The Source of Truth)
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  // req.user is set by the 'protect' middleware which decodes the secure Cookie
  const user = await User.findById(req.user._id).select("-password"); // Get fresh data
  
  console.log("✅ /me endpoint called for:", {
    id: user._id,
    email: user.email,
    isAdmin: user.isAdmin
  });
  
  res.status(200).json({ user });
};