const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Create dynamic storage with folder organization
const createStorage = (folderType) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `gujarat_tourism/${folderType}`, // Dynamic folder based on type
      allowed_formats: ["jpg", "png", "jpeg", "webp"],
      transformation: [{ width: 800, height: 600, crop: "limit" }],
      public_id: (req, file) => {
        // Generate unique filename with timestamp
        const timestamp = Date.now();
        const originalName = file.originalname.split('.')[0];
        return `${folderType}_${timestamp}_${originalName}`;
      }
    },
  });
};

// Create upload instances for different types
const hotelUpload = multer({ 
  storage: createStorage('hotels'),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const placeUpload = multer({ 
  storage: createStorage('places'),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const userUpload = multer({ 
  storage: createStorage('users'),
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit for user profiles
});

// Generic upload (fallback)
const genericUpload = multer({ 
  storage: createStorage('general'),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Export organized upload functions
module.exports = {
  hotelUpload,
  placeUpload, 
  userUpload,
  genericUpload,
  
  // Backward compatibility
  upload: genericUpload
};