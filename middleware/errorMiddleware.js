// @desc    404 Not Found Handler
// @note    This runs if no other route matches the request URL
exports.notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// @desc    Global Error Handler
// @note    This catches any error thrown in the app (DB errors, Auth errors, etc.)
exports.errorHandler = (err, req, res, next) => {
  // 1. Determine Status Code
  // If the status is still 200 (OK) despite an error, force it to 500 (Server Error)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode);

  //2. Format the Message
  let message = err.message;

  // --- OPTIONAL: CLEAN UP MONGOOSE ERRORS ---
  // A. Handle Mongoose "CastError" (e.g., User sends ID "123" but DB expects "65f2...")
  if (err.name === "CastError" && err.kind === "ObjectId") {
    message = "Resource not found.";
    res.status(404);
  }

  // B. Handle Mongoose "ValidationError" (e.g., Password too short)
  if (err.name === "ValidationError") {
    //Create a comma-separated string of all missing fields
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    res.status(400);
  }

  // C. Handle Mongoose Duplicate Key (e.g., Registering with same email)
  if (err.code === 11000) {
    message = "Duplicate field value entered";
    res.status(400);
  }

  // 3. Send Response
  res.json({
    message: message,
    // SECURITY: Only show stack trace in Development mode
    // In Production, this will be null/undefined to hide server details
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};
