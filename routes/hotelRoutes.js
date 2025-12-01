const express = require("express");
const router = express.Router();
const {
  getHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel,
} = require("../controller/hotelController");
const { protect, admin } = require("../middleware/authMiddleware");
const { hotelUpload } = require("../middleware/uploadMiddleware");

// Public Routes
router.get("/", getHotels);
router.get("/:id", getHotelById);

// Admin Routes
// Note: "images" is the field name, 5 is max count
router.post(
  "/", 
  protect, 
  admin, 
  hotelUpload.array("images", 5), 
  createHotel
);

router.put(
  "/:id", 
  protect, 
  admin, 
  hotelUpload.array("images", 5), 
  updateHotel
);

router.delete("/:id", protect, admin, deleteHotel);

module.exports = router;