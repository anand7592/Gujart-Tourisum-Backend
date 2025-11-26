const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protect routes (Verify Token)
exports.protect = async (req, res, next) => {
  let token;

  // 1. Check if Authorization header exists and starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // 2. Get token from header
      // Header format: "Bearer <token_string>"
      token = req.headers.authorization.split(" ")[1];

      // 3. Verify Token
      // This will throw an error if token is expired or invalid
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Get User from the token's ID
      // We exclude the password so we don't accidentally expose it later
      req.user = await User.findById(decoded.id).select("-password");

      // 5. Check if user was deleted *after* token was issued
      if (!req.user) {
        return res
          .status(401)
          .json({ message: "User not found, access denied" });
      }

      next();
    } catch (error) {
      console.error("Auth Error:", error.message);
      // 401 = Unauthorized (Identity unknown/invalid)
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }
};


// @desc    Grant access to Admins only
exports.admin = (req,res,next) => {
    if(req.user && req.user.isAdmin === true){
        next();
    }else{
        // 403 = Forbidden (Identity known, but permission denied)
        res.status(403).json({message: "Not authorized as an admin"});
    }
}