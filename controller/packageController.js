const Package = require("../models/Package");
const Place = require("../models/Place");
const Hotel = require("../models/Hotel");
const User = require("../models/User");

// @desc    Get all packages with filters and pagination
// @route   GET /api/packages
// @access  Public
exports.getPackages = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      difficulty,
      minPrice,
      maxPrice,
      startDate,
      endDate,
      isActive,
      search,
      sortBy = 'startDate',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const query = {};
    
    // Apply filters
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination options
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      populate: [
        { path: 'places', select: 'name location images description' },
        { path: 'hotels', select: 'name location rating images contact' },
        { path: 'createdBy', select: 'firstName lastName' }
      ]
    };

    const packages = await Package.find(query)
      .lean()
      .populate(options.populate)
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit)
      .exec();

    const total = await Package.countDocuments(query);

    res.status(200).json({
      packages,
      pagination: {
        currentPage: options.page,
        totalPages: Math.ceil(total / options.limit),
        totalPackages: total,
        hasNext: options.page < Math.ceil(total / options.limit),
        hasPrev: options.page > 1
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single package by ID
// @route   GET /api/packages/:id
// @access  Public
exports.getPackageById = async (req, res, next) => {
  try {
    const packageId = req.params.id;

    const package = await Package.findById(packageId)
      .populate('places', 'name location images description amenities')
      .populate('hotels', 'name location rating images contact amenities roomTypes')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    if (!package) {
      res.status(404);
      throw new Error("Package not found");
    }

    res.status(200).json(package);
  } catch (error) {
    next(error);
  }
};

// @desc    Create new package
// @route   POST /api/packages
// @access  Private/Admin
exports.createPackage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin;

    if (!isAdmin) {
      res.status(403);
      throw new Error("Access denied. Admin only.");
    }

    // Log the incoming request data for debugging
    console.log('📦 Creating package with data:', {
      places: req.body.places,
      placesType: typeof req.body.places,
      hotels: req.body.hotels,
      hotelsType: typeof req.body.hotels,
      name: req.body.name
    });

    const packageData = {
      ...req.body,
      createdBy: userId
    };

    // Clean and validate places data
    if (packageData.places) {
      // Handle cases where places might be an empty string, "[]", or invalid array
      if (typeof packageData.places === 'string') {
        if (packageData.places === '[]' || packageData.places.trim() === '') {
          packageData.places = [];
        } else {
          try {
            packageData.places = JSON.parse(packageData.places);
          } catch (e) {
            packageData.places = [];
          }
        }
      }
      
      // Filter out empty or invalid ObjectIds
      packageData.places = packageData.places.filter(place => {
        return place && 
               typeof place === 'string' && 
               place.length === 24 && 
               /^[0-9a-fA-F]{24}$/.test(place);
      });
      
      // Validate places exist if any are provided
      if (packageData.places.length > 0) {
        const existingPlaces = await Place.find({ _id: { $in: packageData.places } });
        if (existingPlaces.length !== packageData.places.length) {
          res.status(400);
          throw new Error("One or more places not found");
        }
      } else {
        res.status(400);
        throw new Error("At least one place must be selected for the package");
      }
    } else {
      res.status(400);
      throw new Error("Places are required for creating a package");
    }

    // Clean and validate hotels data (optional)
    if (packageData.hotels) {
      // Handle cases where hotels might be an empty string, "[]", or invalid array
      if (typeof packageData.hotels === 'string') {
        if (packageData.hotels === '[]' || packageData.hotels.trim() === '') {
          packageData.hotels = [];
        } else {
          try {
            packageData.hotels = JSON.parse(packageData.hotels);
          } catch (e) {
            packageData.hotels = [];
          }
        }
      }
      
      // Filter out empty or invalid ObjectIds
      packageData.hotels = packageData.hotels.filter(hotel => {
        return hotel && 
               typeof hotel === 'string' && 
               hotel.length === 24 && 
               /^[0-9a-fA-F]{24}$/.test(hotel);
      });
      
      // Validate hotels exist if any are provided
      if (packageData.hotels.length > 0) {
        const existingHotels = await Hotel.find({ _id: { $in: packageData.hotels } });
        if (existingHotels.length !== packageData.hotels.length) {
          res.status(400);
          throw new Error("One or more hotels not found");
        }
      }
    } else {
      // If no hotels provided, set as empty array
      packageData.hotels = [];
    }

    // Clean and validate itinerary data
    if (packageData.itinerary) {
      // Handle cases where itinerary might be a string
      if (typeof packageData.itinerary === 'string') {
        if (packageData.itinerary === '[]' || packageData.itinerary.trim() === '') {
          packageData.itinerary = [];
        } else {
          try {
            packageData.itinerary = JSON.parse(packageData.itinerary);
          } catch (e) {
            packageData.itinerary = [];
          }
        }
      }
      
      // Validate itinerary days are consecutive if any are provided
      if (packageData.itinerary.length > 0) {
        const days = packageData.itinerary.map(item => item.day).sort((a, b) => a - b);
        for (let i = 0; i < days.length; i++) {
          if (days[i] !== i + 1) {
            res.status(400);
            throw new Error("Itinerary days must be consecutive starting from 1");
          }
        }
      }
    } else {
      packageData.itinerary = [];
    }

    const package = await Package.create(packageData);

    // Populate the created package
    const populatedPackage = await Package.findById(package._id)
      .populate('places', 'name location images')
      .populate('hotels', 'name location rating')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({
      message: "Package created successfully",
      package: populatedPackage
    });
  } catch (error) {
    console.error('❌ Package creation error:', error.message);
    console.error('Error stack:', error.stack);
    next(error);
  }
};

// @desc    Update package
// @route   PUT /api/packages/:id
// @access  Private/Admin
exports.updatePackage = async (req, res, next) => {
  try {
    const packageId = req.params.id;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin;

    if (!isAdmin) {
      res.status(403);
      throw new Error("Access denied. Admin only.");
    }

    const package = await Package.findById(packageId);
    if (!package) {
      res.status(404);
      throw new Error("Package not found");
    }

    // Prepare update data with validation
    const updateData = {
      ...req.body,
      updatedBy: userId
    };

    // Clean and validate places data
    if (updateData.places !== undefined) {
      // Handle cases where places might be an empty string, "[]", or invalid array
      if (typeof updateData.places === 'string') {
        if (updateData.places === '[]' || updateData.places.trim() === '') {
          updateData.places = [];
        } else {
          try {
            updateData.places = JSON.parse(updateData.places);
          } catch (e) {
            updateData.places = [];
          }
        }
      }
      
      // Filter out empty or invalid ObjectIds
      updateData.places = updateData.places.filter(place => {
        return place && 
               typeof place === 'string' && 
               place.length === 24 && 
               /^[0-9a-fA-F]{24}$/.test(place);
      });
      
      // Validate places exist if any are provided
      if (updateData.places.length > 0) {
        const existingPlaces = await Place.find({ _id: { $in: updateData.places } });
        if (existingPlaces.length !== updateData.places.length) {
          res.status(400);
          throw new Error("One or more places not found");
        }
      }
    }

    // Clean and validate hotels data
    if (updateData.hotels !== undefined) {
      // Handle cases where hotels might be an empty string, "[]", or invalid array
      if (typeof updateData.hotels === 'string') {
        if (updateData.hotels === '[]' || updateData.hotels.trim() === '') {
          updateData.hotels = [];
        } else {
          try {
            updateData.hotels = JSON.parse(updateData.hotels);
          } catch (e) {
            updateData.hotels = [];
          }
        }
      }
      
      // Filter out empty or invalid ObjectIds
      updateData.hotels = updateData.hotels.filter(hotel => {
        return hotel && 
               typeof hotel === 'string' && 
               hotel.length === 24 && 
               /^[0-9a-fA-F]{24}$/.test(hotel);
      });
      
      // Validate hotels exist if any are provided
      if (updateData.hotels.length > 0) {
        const existingHotels = await Hotel.find({ _id: { $in: updateData.hotels } });
        if (existingHotels.length !== updateData.hotels.length) {
          res.status(400);
          throw new Error("One or more hotels not found");
        }
      }
    }

    const updatedPackage = await Package.findByIdAndUpdate(
      packageId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('places', 'name location images')
      .populate('hotels', 'name location rating')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    res.status(200).json({
      message: "Package updated successfully",
      package: updatedPackage
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete package
// @route   DELETE /api/packages/:id
// @access  Private/Admin
exports.deletePackage = async (req, res, next) => {
  try {
    const packageId = req.params.id;
    const isAdmin = req.user.isAdmin;

    if (!isAdmin) {
      res.status(403);
      throw new Error("Access denied. Admin only.");
    }

    const package = await Package.findById(packageId);
    if (!package) {
      res.status(404);
      throw new Error("Package not found");
    }

    // Check if package has bookings (you would check PackageBooking model)
    // For now, we'll just delete the package
    await Package.findByIdAndDelete(packageId);

    res.status(200).json({
      message: "Package deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get package statistics
// @route   GET /api/packages/stats
// @access  Private/Admin
exports.getPackageStats = async (req, res, next) => {
  try {
    const isAdmin = req.user.isAdmin;

    if (!isAdmin) {
      res.status(403);
      throw new Error("Access denied. Admin only.");
    }

    const { startDate, endDate } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get basic statistics
    const totalPackages = await Package.countDocuments(dateFilter);
    const activePackages = await Package.countDocuments({
      ...dateFilter,
      isActive: true
    });
    const inactivePackages = await Package.countDocuments({
      ...dateFilter,
      isActive: false
    });

    // Get category statistics
    const categoryStats = await Package.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          avgPrice: { $avg: "$price" },
          avgRating: { $avg: "$rating" }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get monthly package creation trends
    const monthlyStats = await Package.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 },
          avgPrice: { $avg: "$price" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Get top rated packages
    const topRatedPackages = await Package.find(dateFilter)
      .sort({ rating: -1 })
      .limit(5)
      .select('name rating reviewCount price category')
      .populate('places', 'name location');

    res.status(200).json({
      totalPackages,
      activePackages,
      inactivePackages,
      categoryStats,
      monthlyTrends: monthlyStats,
      topRatedPackages
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search packages
// @route   GET /api/packages/search
// @access  Public
exports.searchPackages = async (req, res, next) => {
  try {
    const { query, category, minPrice, maxPrice, difficulty, page = 1, limit = 10 } = req.query;

    if (!query || query.trim() === '') {
      res.status(400);
      throw new Error("Search query is required");
    }

    // Build search filters
    const filters = {};
    if (category) filters.category = category;
    if (difficulty) filters.difficulty = difficulty;
    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price.$gte = Number(minPrice);
      if (maxPrice) filters.price.$lte = Number(maxPrice);
    }

    const packages = await Package.searchPackages(query.trim(), filters)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('places', 'name location images')
      .populate('hotels', 'name location rating');

    const total = await Package.countDocuments({
      $and: [
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { category: { $regex: query, $options: 'i' } }
          ]
        },
        filters,
        { isActive: true }
      ]
    });

    res.status(200).json({
      packages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalPackages: total
      },
      searchQuery: query
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get packages by category
// @route   GET /api/packages/category/:category
// @access  Public
exports.getPackagesByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10, sortBy = 'startDate' } = req.query;

    const validCategories = ["Adventure", "Cultural", "Religious", "Nature", "Heritage", "Beach", "Wildlife", "Wellness"];
    if (!validCategories.includes(category)) {
      res.status(400);
      throw new Error("Invalid category");
    }

    const packages = await Package.findByCategory(category)
      .sort({ [sortBy]: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('places', 'name location images')
      .populate('hotels', 'name location rating');

    const total = await Package.countDocuments({ category, isActive: true });

    res.status(200).json({
      packages,
      category,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalPackages: total
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle package active status
// @route   PATCH /api/packages/:id/toggle-status
// @access  Private/Admin
exports.togglePackageStatus = async (req, res, next) => {
  try {
    const packageId = req.params.id;
    const isAdmin = req.user.isAdmin;

    if (!isAdmin) {
      res.status(403);
      throw new Error("Access denied. Admin only.");
    }

    const package = await Package.findById(packageId);
    if (!package) {
      res.status(404);
      throw new Error("Package not found");
    }

    package.isActive = !package.isActive;
    package.updatedBy = req.user.id;
    await package.save();

    res.status(200).json({
      message: `Package ${package.isActive ? 'activated' : 'deactivated'} successfully`,
      package: {
        id: package._id,
        name: package.name,
        isActive: package.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};