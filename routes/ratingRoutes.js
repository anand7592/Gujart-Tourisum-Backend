const express = require("express");
const router = express.Router();
const {
  getRatings,
  getRatingById,
  createRating,
  updateRating,
  deleteRating,
  markHelpful,
  addAdminResponse,
} = require("../controller/ratingController");
const { protect, admin } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.get("/", getRatings);
router.get("/:id", getRatingById);
router.post("/", protect, upload.array("images", 3), createRating);
router.put("/:id", protect, upload.array("images", 3), updateRating);
router.delete("/:id", protect, deleteRating);
router.put("/:id/helpful", protect, markHelpful);
router.put("/:id/respond", protect, admin, addAdminResponse);

module.exports = router;