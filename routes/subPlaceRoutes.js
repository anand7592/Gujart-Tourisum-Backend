const express = require("express");
const router = express.Router();
const {
  getSubPlaces,
  getSubPlaceById,
  createSubPlace,
  updateSubPlace,
  deleteSubPlace,
} = require("../controller/subPlaceController");
const { protect, admin } = require("../middleware/authMiddleware");
const { placeUpload } = require("../middleware/uploadMiddleware");

router.get("/", getSubPlaces);
router.get("/:id", getSubPlaceById);
router.post("/", protect, admin, placeUpload.single("image"), createSubPlace);
router.put("/:id", protect, admin, placeUpload.single("image"), updateSubPlace);
router.delete("/:id", protect, admin, deleteSubPlace);

module.exports = router;