const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" } // Expire from 7d for security
  );
};

// Helper function to set cookie with token
const setTokenCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true, // Cannot be accessed via JavaScript (XSS protection)
    secure: process.env.NODE_ENV === "production", // Only HTTPS in production
    sameSite: "strict", // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  };

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
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 4. Generate Token and set cookie
    const token = generateToken(user);
    setTokenCookie(res, token);

    // 5. Sanitize Output
    const userData = user.toObject();
    delete userData.password;

    // 6. Send Response
    res.status(200).json({
      message: "Login successful",
      user: userData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user (Clear cookie)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: new Date(0), // Expire immediately
  });

  res.status(200).json({
    message: "Logged out successfully",
  });
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  // req.user is already set by protect middleware
  res.status(200).json({
    user: req.user,
  });
};