**Live Frontend**: (https://gujrattour.netlify.app/)

# 🏛️ Gujarat Tourism Backend API

A comprehensive Node.js/Express backend system for managing Gujarat tourism services, including places, hotels, bookings, packages, and user management with secure authentication and payment integration.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Security Features](#security-features)
- [API Endpoints](#api-endpoints)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Database Models](#database-models)
- [Middleware](#middleware)
- [Payment Integration](#payment-integration)
- [File Upload & Cloud Storage](#file-upload--cloud-storage)

---

## 🎯 Overview

This is a production-ready REST API backend for a Gujarat tourism platform that enables users to:
- Explore tourist destinations and places
- Browse and book hotels
- Purchase tour packages
- Leave ratings and reviews
- Make secure online payments
- Manage bookings and user profiles

**Live Frontend**: [https://gujrattour.netlify.app/](https://gujrattour.netlify.app/)

---

## ✨ Key Features

### 🔐 Authentication & Authorization
- JWT-based secure authentication
- HTTP-only cookie sessions
- Role-based access control (User/Admin)
- Password hashing with bcrypt
- Rate limiting on auth endpoints

### 🏨 Hotel Management
- Create, read, update, delete hotels
- Multiple room types support
- Amenities and pricing management
- Image uploads to Cloudinary
- Rating and review system

### 📍 Place Management
- Main tourist destinations (Places)
- Sub-places within destinations
- Entry fees and timing information
- Image galleries
- Location-based features

### 📦 Tour Packages
- Multi-day tour packages
- Itinerary planning
- Price and difficulty levels
- Category-based filtering
- Group size management
- Package booking system

### 💳 Booking System
- Hotel room bookings
- Date range selection
- Guest information collection
- Booking status tracking
- Cancellation with refund calculation
- Payment status management

### 💰 Payment Integration
- Razorpay payment gateway
- Order creation and verification
- Payment signature validation
- Webhook support for payment events
- Secure transaction handling

### ⭐ Rating & Review System
- Rate hotels, places, and sub-places
- Multi-criteria ratings (cleanliness, service, etc.)
- Image attachments
- Admin responses
- Helpful vote tracking

---

## 🛠️ Technology Stack

### Core
- **Runtime**: Node.js
- **Framework**: Express.js v5.1.0
- **Database**: MongoDB with Mongoose ODM

### Security
- **helmet**: HTTP header security
- **cors**: Cross-origin resource sharing
- **express-rate-limit**: Request rate limiting
- **jsonwebtoken**: JWT authentication
- **bcrypt**: Password hashing
- **mongo-sanitize**: NoSQL injection prevention
- **validator**: Input validation and sanitization

### File Upload & Storage
- **multer**: Multipart form data handling
- **cloudinary**: Cloud image storage
- **multer-storage-cloudinary**: Direct Cloudinary uploads

### Payment
- **razorpay**: Payment gateway integration

---

## 📁 Project Structure

```
gujarat-tourism-backend/
│
├── config/                      # Configuration files
│   ├── db.js                   # MongoDB connection
│   └── cloudinary.js           # Cloudinary setup & helpers
│
├── controller/                  # Business logic
│   ├── authController.js       # Authentication (login, register, logout)
│   ├── userController.js       # User CRUD operations
│   ├── placeController.js      # Tourist places management
│   ├── subPlaceController.js   # Sub-places within destinations
│   ├── hotelController.js      # Hotel management
│   ├── packageController.js    # Tour packages
│   ├── bookingController.js    # Booking & payment handling
│   └── ratingController.js     # Reviews and ratings
│
├── middleware/                  # Custom middleware
│   ├── authMiddleware.js       # JWT verification & role checks
│   ├── errorMiddleware.js      # Global error handling
│   └── uploadMiddleware.js     # Multer/Cloudinary file uploads
│
├── models/                      # Mongoose schemas
│   ├── User.js                 # User accounts
│   ├── Place.js                # Tourist destinations
│   ├── SubPlace.js             # Sub-destinations
│   ├── Hotel.js                # Hotel listings
│   ├── Package.js              # Tour packages
│   ├── Booking.js              # Hotel bookings
│   └── Rating.js               # User reviews
│
├── routes/                      # API route definitions
│   ├── authRoutes.js           # /api/auth
│   ├── userRoutes.js           # /api/users
│   ├── placeRoutes.js          # /api/places
│   ├── subPlaceRoutes.js       # /api/subplaces
│   ├── hotelRoutes.js          # /api/hotels
│   ├── packageRoutes.js        # /api/packages
│   ├── bookingRoutes.js        # /api/bookings
│   └── ratingRoutes.js         # /api/ratings
│
├── .env                         # Environment variables (not in repo)
├── .gitignore                   # Git ignore rules
├── package.json                 # Dependencies
├── server.js                    # Application entry point
└── README.md                    # This file
```

---

## 🔒 Security Features

### 1. **Helmet.js**
Sets secure HTTP headers to protect against common vulnerabilities:
- XSS attacks
- Clickjacking
- MIME type sniffing
- DNS prefetch control

### 2. **CORS Protection**
- Whitelist-based origin validation
- Credentials support for cookies
- Controlled HTTP methods

### 3. **JWT Authentication**
- Secure token generation
- HTTP-only cookies (XSS protection)
- Token expiration (7 days)
- Production-ready cookie settings (secure, sameSite)

### 4. **Rate Limiting**
- 10 requests per 15 minutes on auth endpoints
- Prevents brute force attacks

### 5. **Input Sanitization**
- **mongo-sanitize**: Prevents NoSQL injection
- **validator**: Email validation, string escaping
- Applied to body, query, and params

### 6. **Password Security**
- Bcrypt hashing with salt rounds
- Pre-save hooks for automatic hashing
- Password comparison methods

### 7. **Data Validation**
- Mongoose schema validation
- Required field checks
- Data type enforcement
- Custom validators

---

## 🔌 API Endpoints

### 🔐 Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register` | Public | Create new user account |
| POST | `/login` | Public | Login and get JWT token |
| GET | `/logout` | Public | Clear authentication cookie |
| GET | `/me` | Private | Get current user profile |

**Rate Limit**: 10 requests per 15 minutes

---

### 👥 Users (`/api/users`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Admin | Get all users |
| GET | `/:id` | Private | Get user by ID |
| POST | `/` | Admin | Create user manually |
| PUT | `/:id` | Private | Update user |
| DELETE | `/:id` | Admin | Delete user |

---

### 📍 Places (`/api/places`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | Get all places |
| POST | `/` | Admin | Create place (with images) |
| PUT | `/:id` | Admin | Update place |
| DELETE | `/:id` | Admin | Delete place |

**Upload**: Up to 10 images per place → `gujarat_tourism/places/`

---

### 🏛️ Sub-Places (`/api/subplaces`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | Get all sub-places |
| GET | `/:id` | Public | Get sub-place details |
| POST | `/` | Admin | Create sub-place (with image) |
| PUT | `/:id` | Admin | Update sub-place |
| DELETE | `/:id` | Admin | Delete sub-place |

**Upload**: Single image → `gujarat_tourism/places/`

---

### 🏨 Hotels (`/api/hotels`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | Get all hotels (filter by placeId) |
| GET | `/:id` | Public | Get hotel details |
| POST | `/` | Admin | Create hotel (with images) |
| PUT | `/:id` | Admin | Update hotel |
| DELETE | `/:id` | Admin | Delete hotel |

**Upload**: Up to 5 images per hotel → `gujarat_tourism/hotels/`

**Features**:
- Room types with pricing
- Amenities list
- Category (Budget, Luxury, Resort, etc.)
- Average rating & review count

---

### 📦 Packages (`/api/packages`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | Get all packages (with filters) |
| GET | `/search` | Public | Search packages |
| GET | `/category/:category` | Public | Get by category |
| GET | `/:id` | Public | Get package details |
| GET | `/admin/stats` | Admin | Package statistics |
| POST | `/` | Admin | Create package (with images) |
| PUT | `/:id` | Admin | Update package |
| DELETE | `/:id` | Admin | Delete package |
| PATCH | `/:id/toggle-status` | Admin | Activate/deactivate |

**Upload**: Up to 10 images → `gujarat_tourism/general/`

**Filters**:
- Category (Adventure, Cultural, Religious, etc.)
- Difficulty (Easy, Moderate, Hard)
- Price range
- Date range
- Search query

---

### 🎫 Bookings (`/api/bookings`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Private | Get all bookings (admin) or user's bookings |
| GET | `/my-bookings` | Private | Get current user's bookings |
| GET | `/stats` | Admin | Booking statistics |
| GET | `/:id` | Private | Get booking details |
| POST | `/` | Private | Create new booking |
| POST | `/:id/create-order` | Private | Create Razorpay order |
| POST | `/verify-payment` | Private | Verify payment signature |
| POST | `/webhook` | Public | Razorpay webhook handler |
| PATCH | `/:id/status` | Private | Update booking status |
| PATCH | `/:id/payment` | Private | Update payment status |
| DELETE | `/:id` | Private | Cancel booking |

**Booking Flow**:
1. User creates booking → Status: Pending
2. Backend creates Razorpay order
3. Frontend processes payment
4. Backend verifies payment signature
5. Booking status → Confirmed

**Cancellation Policy**:
- >48 hours: 100% refund
- 24-48 hours: 50% refund
- <24 hours: No refund

---

### ⭐ Ratings (`/api/ratings`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | Get ratings (filter by hotel/place) |
| GET | `/:id` | Public | Get rating details |
| POST | `/` | Private | Create rating (with images) |
| PUT | `/:id` | Private | Update own rating |
| DELETE | `/:id` | Private | Delete rating |
| PUT | `/:id/helpful` | Private | Mark as helpful |
| PUT | `/:id/respond` | Admin | Add admin response |

**Upload**: Up to 3 images → `gujarat_tourism/general/`

**Rating Types**:
- Hotel rating (with cleanliness, service, location, value)
- Place rating
- Sub-place rating

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- Cloudinary account
- Razorpay account

### Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd gujarat-tourism-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create `.env` file**
```bash
cp .env.example .env
```

4. **Configure environment variables** (see next section)

5. **Start the server**
```bash
# Development
npm run dev

# Production
npm start
```

6. **Verify server**
```
Server: http://localhost:5000
Health: http://localhost:5000/api/health
```

---

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Server
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# Database
MONGO_URI=mongodb://localhost:27017/gujarat-tourism
# Or MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# JWT
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

---

## 🗄️ Database Models

### User
- Authentication & authorization
- Password hashing (bcrypt)
- Admin flag
- Personal information (name, email, address, contact)

### Place
- Tourist destinations
- Images, description, location
- Entry price
- Creator tracking

### SubPlace
- Nested locations within places
- Opening hours
- Best time to visit
- Features list

### Hotel
- Accommodation listings
- Multiple room types
- Amenities
- Price per night
- Category (Budget/Luxury/Resort)
- Rating aggregation

### Package
- Tour packages with itinerary
- Multi-day trips
- Group size limits
- Category & difficulty
- Pricing with discounts
- Slot availability tracking

### Booking
- Hotel reservations
- Date range validation
- Guest information
- Payment tracking
- Status management
- Cancellation handling
- Refund calculation

### Rating
- Multi-type ratings (Hotel/Place/SubPlace)
- Overall + detailed scores
- Image attachments
- Admin responses
- Helpful votes

---

## 🛡️ Middleware

### 1. **authMiddleware.js**

#### `protect`
- Verifies JWT token from cookie or Authorization header
- Attaches user object to `req.user`
- Blocks unauthorized requests

#### `admin`
- Checks if authenticated user has admin privileges
- Must be used after `protect` middleware

**Usage**:
```javascript
router.post('/hotels', protect, admin, createHotel);
```

---

### 2. **errorMiddleware.js**

#### `notFound`
- Catches 404 errors for undefined routes

#### `errorHandler`
- Global error handler
- Formats error responses
- Handles Mongoose errors:
  - CastError (invalid ObjectId)
  - ValidationError
  - Duplicate key (E11000)
- Hides stack traces in production

---

### 3. **uploadMiddleware.js**

Provides organized file upload handlers:

#### `hotelUpload`
- Folder: `gujarat_tourism/hotels/`
- Max files: 5
- Size limit: 5MB

#### `placeUpload`
- Folder: `gujarat_tourism/places/`
- Max files: 10
- Size limit: 5MB

#### `userUpload`
- Folder: `gujarat_tourism/users/`
- Max files: 1
- Size limit: 2MB

#### `genericUpload`
- Folder: `gujarat_tourism/general/`
- Max files: 5
- Size limit: 5MB

**Features**:
- Automatic image transformation (800x600, crop limit)
- Timestamp-based unique filenames
- Format support: jpg, png, jpeg, webp

---

## 💳 Payment Integration

### Razorpay Flow

1. **Create Order** (`POST /api/bookings/:id/create-order`)
   - Backend creates Razorpay order
   - Returns order ID and amount

2. **Frontend Payment**
   - User completes payment via Razorpay checkout
   - Razorpay returns payment details

3. **Verify Payment** (`POST /api/bookings/verify-payment`)
   - Backend validates payment signature
   - Updates booking status to Confirmed

4. **Webhook** (`POST /api/bookings/webhook`)
   - Handles asynchronous payment events
   - Updates payment status automatically

**Security**:
- HMAC SHA256 signature verification
- Secure key storage in environment variables
- Payment state validation

---

## 📤 File Upload & Cloud Storage

### Cloudinary Organization

```
gujarat_tourism/
├── hotels/          # Hotel images
├── places/          # Place & sub-place images
├── users/           # User profile images
└── general/         # Ratings & other uploads
```

### Upload Process

1. **Frontend** sends multipart form data
2. **Multer** parses the upload
3. **Cloudinary** stores the file
4. **URL** returned to controller
5. **MongoDB** stores the Cloudinary URL

### Features
- Automatic image optimization
- Organized folder structure
- Unique filenames with timestamps
- Easy file deletion via public_id

**Helper Functions**:
```javascript
cloudinary.helpers.getFolderPath('hotel')    // → 'gujarat_tourism/hotels'
cloudinary.helpers.deleteFromFolder(id, 'hotels')
cloudinary.helpers.getFilesFromFolder('gujarat_tourism/places')
```

---



Manual testing with tools:
- **Postman** / **Thunder Client** / **Insomnia**
- Import collection from `/api/health` response

---

## 📈 Future Enhancements

- [ ] Email notifications (booking confirmations)
- [ ] SMS integration
- [ ] Advanced search with filters
- [ ] Recommendations engine
- [ ] Multi-language support
- [ ] Analytics dashboard
- [ ] Payment history tracking
- [ ] Loyalty program

---

## 👨‍💻 Author

**Anand**  
Gujarat Tourism Backend API

---

## 📄 License

ISC License

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub

---

**⭐ If this project helped you, please give it a star!**
