const express = require("express");
const router = express.Router();
const {
  getPlaces,
  createPlace,
  updatePlace,
  deletePlace,
} = require("../controller/placeController");
const { protect, admin } = require("../middleware/authMiddleware");

// Public: Get all places
router.get("/", getPlaces);

// Admin Only: Create, Update, Delete
router.post("/", protect, admin, createPlace);
router.route("/:id")
  .put(protect, admin, updatePlace)
  .delete(protect, admin, deletePlace);

module.exports = router;