const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protect routes (Verify Token)
exports.protect = async (req, res, next) => {
  let token;

  // DEBUG: Log what cookies we're receiving
  console.log("🍪 All Cookies:", req.cookies);
  console.log("🔑 Token Cookie:", req.cookies.token);
  console.log("📋 Headers:", req.headers.authorization);

  // 1. Check for token in cookie FIRST (since you're setting it in cookie)
  if (req.cookies.token) {
    token = req.cookies.token;
    console.log("✅ Token found in cookie");
  }
  // 2. Fallback to Authorization header (for API clients)
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
    console.log("✅ Token found in Authorization header");
  }

  // 3. If no token found anywhere
  if (!token) {
    console.log("❌ No token found anywhere");
    return res.status(401).json({ 
      message: "Not authorized, no token",
      debug: {
        hasCookies: !!req.cookies,
        cookieKeys: Object.keys(req.cookies || {}),
        hasAuthHeader: !!req.headers.authorization
      }
    });
  }

  try {
    // 4. Verify Token
    console.log("🔍 Verifying token...");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token verified, decoded:", decoded);

    // 5. Get User from the token's ID
    req.user = await User.findById(decoded.id).select("-password");

    // 6. Check if user was deleted *after* token was issued
    if (!req.user) {
      console.log("❌ User not found in database");
      return res
        .status(401)
        .json({ message: "User not found, access denied" });
    }

    console.log("✅ User authenticated:", {
      id: req.user._id,
      email: req.user.email,
      isAdmin: req.user.isAdmin
    });

    // SUCCESS: Move to the controller
    next();
  } catch (error) {
    console.error("❌ Auth Error:", error.message);
    // 401 = Unauthorized (Identity unknown/invalid)
    return res.status(401).json({ 
      message: "Not authorized, token failed",
      error: error.message 
    });
  }
};

// @desc    Grant access to Admins only
exports.admin = (req, res, next) => {
  console.log("🔐 Checking admin access for:", {
    userId: req.user?._id,
    isAdmin: req.user?.isAdmin
  });

  if (req.user && req.user.isAdmin === true) {
    console.log("✅ Admin access granted");
    next();
  } else {
    console.log("❌ Admin access denied");
    // 403 = Forbidden (Identity known, but permission denied)
    res.status(403).json({ 
      message: "Not authorized as an admin",
      debug: {
        userId: req.user?._id,
        isAdmin: req.user?.isAdmin
      }
    });
  }
};