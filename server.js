const express = require("express");
const dotenv = require("dotenv");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const sanitize = require("mongo-sanitize");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// 1. CONFIG
dotenv.config();

// IMPORTS ROUTES
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const placeRoutes = require("./routes/placeRoutes");
const subPlaceRoutes = require("./routes/subPlaceRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const hotelRoutes = require("./routes/hotelRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const packageRoutes = require("./routes/packageRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// 2. CONNECT TO DATABASE
connectDB();

// --- SECURITY MIDDLEWARE ---

// A. Helmet: Sets various HTTP headers to secure the app
app.use(helmet());

// B. CORS: Allows your Frontend to talk to this Backend
// IMPORTANT: 'credentials: true' is required for cookies to work
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "https://gujrattour.netlify.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `The CORS policy for this site does not allow access from origin ${origin}`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true, // CRITICAL: Allows cookies to be sent/received
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// --- STANDARD MIDDLEWARE ---

// Cookie Parser - REQUIRED for reading cookies from requests
app.use(cookieParser());

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// C. Data Sanitization: Prevents NoSQL Injection
app.use((req, res, next) => {
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  next();
});

// --- ROUTES ---
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/places", placeRoutes);
app.use("/api/subplaces", subPlaceRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/packages", packageRoutes);

// --- HEALTH CHECK ROUTE (Optional but recommended) ---
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// --- ERROR HANDLING ---
// (Must be the last app.use calls)
app.use(notFound);
app.use(errorHandler);

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(
    `🚀 Server is running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`
  );
  console.log(`📡 API available at: http://localhost:${PORT}/api`);
  console.log(`🌐 Frontend URL: ${process.env.CLIENT_URL || "http://localhost:5173"}`);
});

module.exports = app;