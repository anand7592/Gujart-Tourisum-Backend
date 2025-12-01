const cloudinary = require("cloudinary").v2;

console.log("Cloudinary ENV check =>", {
  name: process.env.CLOUDINARY_CLOUD_NAME,
  key: process.env.CLOUDINARY_API_KEY ? "LOADED" : "MISSING",
  secret: process.env.CLOUDINARY_API_SECRET ? "LOADED" : "MISSING",
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper functions for organized uploads
const cloudinaryHelpers = {
  // Get folder path for specific upload type
  getFolderPath: (type) => {
    const basePath = 'gujarat_tourism';
    switch (type) {
      case 'hotel':
      case 'hotels':
        return `${basePath}/hotels`;
      case 'place':
      case 'places':
        return `${basePath}/places`;
      case 'user':
      case 'users':
        return `${basePath}/users`;
      case 'profile':
        return `${basePath}/users/profiles`;
      default:
        return `${basePath}/general`;
    }
  },

  // Delete files from specific folder
  deleteFromFolder: async (publicId, folder) => {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      console.log(`📁 Deleted from ${folder}:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Error deleting from ${folder}:`, error);
      throw error;
    }
  },

  // Get all files from a specific folder
  getFilesFromFolder: async (folderPath) => {
    try {
      const result = await cloudinary.search
        .expression(`folder:${folderPath}`)
        .sort_by([['created_at', 'desc']])
        .max_results(100)
        .execute();
      
      return result.resources;
    } catch (error) {
      console.error(`❌ Error getting files from ${folderPath}:`, error);
      throw error;
    }
  }
};

// Export both cloudinary instance and helpers
module.exports = cloudinary;
module.exports.helpers = cloudinaryHelpers;
