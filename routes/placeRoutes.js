const express = require("express");
const router = express.Router();
const {
  getPlaces,
  createPlace,
  updatePlace,
  deletePlace,
} = require("../controller/placeController");
const { protect, admin } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Public: Get all places
router.get("/", getPlaces);

// Admin Only: Create, Update, Delete
// Apply upload middleware to POST and PUT
router.post("/", protect, admin, upload.single("image"), createPlace);
router.put("/:id", protect, admin, upload.single("image"), updatePlace);

router.delete("/:id", protect, admin, deletePlace);

module.exports = router;
