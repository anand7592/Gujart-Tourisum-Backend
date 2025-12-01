# 📁 Cloudinary Folder Organization

## 🎯 **New Organized Structure**

Your Cloudinary uploads are now automatically organized into separate folders:

### **Folder Structure:**
```
gujarat_tourism/
├── hotels/          # Hotel images
├── places/          # Place/destination images  
├── users/           # User profile images
└── general/         # Other uploads (ratings, etc.)
```

### **Upload Endpoints with Folder Organization:**

#### **🏨 Hotel Images → `gujarat_tourism/hotels/`**
```
POST /api/hotels (with images)
PUT /api/hotels/:id (with images)

Field name: "images"
Max files: 5
File format: hotels_timestamp_filename.jpg
```

#### **🏞️ Place Images → `gujarat_tourism/places/`**
```
POST /api/places (with images)  
PUT /api/places/:id (with images)
POST /api/sub-places (with images)
PUT /api/sub-places/:id (with images)

Field name: "images" (places) or "image" (sub-places)
Max files: 10 (places), 1 (sub-places)
File format: places_timestamp_filename.jpg
```

#### **👤 User Images → `gujarat_tourism/users/`**
```
Available for future user profile features
Field name: "profileImage"
Max files: 1
File format: users_timestamp_filename.jpg
```

#### **⭐ Rating Images → `gujarat_tourism/general/`**
```
POST /api/ratings (with images)
PUT /api/ratings/:id (with images)

Field name: "images"
Max files: 3
File format: general_timestamp_filename.jpg
```

## 🔧 **Technical Implementation:**

### **Dynamic Storage Creation:**
- Each upload type gets its own Cloudinary folder
- Automatic filename generation with timestamps
- File size limits per upload type
- Organized public_id naming convention

### **Helper Functions Available:**
```javascript
// Get folder path for upload type
cloudinary.helpers.getFolderPath('hotel') // → 'gujarat_tourism/hotels'

// Delete from specific folder
cloudinary.helpers.deleteFromFolder(publicId, 'hotels')

// Get all files from folder
cloudinary.helpers.getFilesFromFolder('gujarat_tourism/places')
```

## 📋 **Benefits:**

✅ **Organized Management:** Easy to find specific type of images
✅ **Better Performance:** Faster searches within categories  
✅ **Clean URLs:** Clear folder structure in Cloudinary dashboard
✅ **Scalable:** Easy to add new upload categories
✅ **Backup Friendly:** Can backup specific folders separately

## 🎮 **Testing the New Structure:**

When you upload images now:

1. **Hotel images** will appear in: `gujarat_tourism/hotels/`
2. **Place images** will appear in: `gujarat_tourism/places/`  
3. **Rating images** will appear in: `gujarat_tourism/general/`

Check your Cloudinary dashboard after uploads to see the organized folder structure! 🚀