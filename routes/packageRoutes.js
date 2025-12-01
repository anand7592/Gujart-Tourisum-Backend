const express = require("express");
const router = express.Router();
const {
  getPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
  getPackageStats,
  searchPackages,
  getPackagesByCategory,
  togglePackageStatus,
} = require("../controller/packageController");
const { protect, admin } = require("../middleware/authMiddleware");
const { genericUpload } = require("../middleware/uploadMiddleware");

// Test route to verify package routes are working
router.get("/test", (req, res) => {
  res.status(200).json({
    message: "Package routes are working!",
    timestamp: new Date().toISOString()
  });
});

// Public routes
router.get("/", getPackages);
router.get("/search", searchPackages);
router.get("/category/:category", getPackagesByCategory);
router.get("/:id", getPackageById);

// Protected routes (Admin only)
router.get("/admin/stats", protect, admin, getPackageStats);
router.post("/", protect, admin, genericUpload.array("images", 10), createPackage);
router.put("/:id", protect, admin, genericUpload.array("images", 10), updatePackage);
router.delete("/:id", protect, admin, deletePackage);
router.patch("/:id/toggle-status", protect, admin, togglePackageStatus);

module.exports = router;