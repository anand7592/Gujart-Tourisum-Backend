const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary"); // <--- Import from config

// Configure Storage Engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "gujarat_tourism", // The folder name in your Cloudinary Dashboard
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    // Optional: transformation to resize images automatically
    transformation: [{ width: 800, height: 600, crop: "limit" }]
  },
});

// Create the Multer instance
const upload = multer({ storage: storage });

module.exports = upload;