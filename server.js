const express = require("express");
const dotenv = require("dotenv");
const helmet = require("helmet");
const cors = require("cors");
const sanitize = require("mongo-sanitize");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");


//imports Routes
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');

// 1. Config
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// 2. CONNECT TO DATABASE
// We call this early. The server logic below will wait for this connection.
connectDB();

// --- SECURITY MIDDLEWARE ---

// A. Helmet: Sets various HTTP headers to secure the app
// (e.g., hides "X-Powered-By: Express" so hackers don't know your tech stack)
app.use(helmet());

// B. CORS: Allows your Frontend to talk to this Backend
// In production, replace '*' with your actual frontend URL (e.g., 'https://myapp.com')
app.use(cors({
  origin: process.env.CLIENT_URL || "*", 
  credentials: true
}));

// --- STANDARD MIDDLEWARE ---
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies


// C. Data Sanitization: Prevents NoSQL Injection
// Stops hackers from sending data like { "$gt": "" } to bypass logins
// This replaces 'express-mongo-sanitize' to fix the "Read-Only" bug
app.use((req, res, next) => {
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  next();
});



// --- ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// --- ERROR HANDLING ---
// (Must be the last app.use calls)
app.use(notFound);
app.use(errorHandler);

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});