const express = require("express");
const router = express.Router();
const {
  getPlaces,
  createPlace,
  updatePlace,
  deletePlace,
} = require("../controller/placeController");
const { protect, admin } = require("../middleware/authMiddleware");
const { placeUpload } = require("../middleware/uploadMiddleware");

// Public: Get all places
router.get("/", getPlaces);

// Admin Only: Create, Update, Delete
// Apply upload middleware to POST and PUT with place-specific folder
router.post("/", protect, admin, placeUpload.single("image"), createPlace);
router.put("/:id", protect, admin, placeUpload.single("image"), updatePlace);

router.delete("/:id", protect, admin, deletePlace);

module.exports = router;
