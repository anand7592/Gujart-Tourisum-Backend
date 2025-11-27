const express = require("express");
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require("../controller/userController");

const { protect, admin } = require("../middleware/authMiddleware");

// --- GROUP 1: Root Routes ("/") ---
// 1. Get all users (Admin only)
// 2. Create a user manually (Admin only - usually done via /register)

router.route("/")
    .get(protect, admin, getUsers)
    .post(protect, admin, createUser);

// --- GROUP 2: ID Routes ("/:id") ---
// 1. Get One User
// 2. Update User
// 3. Delete User (Admin only)
router.route("/:id")
    .get(protect,getUserById)   // Controller must check: Is it ME or am I Admin?
    .put(protect, updateUser)   // Controller must check: Is it ME or am I Admin?
    .delete(protect, admin, deleteUser);
    
module.exports = router;    