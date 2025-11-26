const jwt = require("jsonwebtoken");
const User = require("../models/User");

//helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "30d" }
  );
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

    // 1. Check existing
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

    // 3. Generate Token
    const token = generateToken(user);

    // 4. Remove password from response
    const userData = user.toObject();
    delete userData.password;

    res.status(201).json({
      message: "User registered successfully",
      token,
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

    // 1. SECURITY: Input Validation
    // Don't bother the database if data is missing
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

    // 4. Generate Token
    const token = generateToken(user);

    // 5. SECURITY: Sanitize Output
    // Convert to plain object to modify it
    const userData = user.toObject();
    delete userData.password;

    // 6. Send Response
    res.status(200).json({
      message: "Login successful",
      token,
      user: userData,
    });
  } catch (error) {
    next(error);
  }
};
