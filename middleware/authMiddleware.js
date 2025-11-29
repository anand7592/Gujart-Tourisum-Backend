const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protect routes (Verify Token)
exports.protect = async (req, res, next) => {
  let token;

  // 1. Check for token in cookie FIRST (since you're setting it in cookie)
  if (req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Fallback to Authorization header (for API clients)
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // 3. If no token found anywhere
  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    // 4. Verify Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Get User from the token's ID
    req.user = await User.findById(decoded.id).select("-password");

    // 6. Check if user was deleted *after* token was issued
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "User not found, access denied" });
    }

    // SUCCESS: Move to the controller
    next();
  } catch (error) {
    console.error("Auth Error:", error.message);
    // 401 = Unauthorized (Identity unknown/invalid)
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// @desc    Grant access to Admins only
exports.admin = (req, res, next) => {
  if (req.user && req.user.isAdmin === true) {
    next();
  } else {
    // 403 = Forbidden (Identity known, but permission denied)
    res.status(403).json({ message: "Not authorized as an admin" });
  }
};