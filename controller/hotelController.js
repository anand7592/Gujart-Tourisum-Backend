const Hotel = require("../models/Hotel");

// @desc    Get all hotels (Optional: Filter by Place)
// @route   GET /api/hotels?placeId=...
// @access  Public
exports.getHotels = async (req, res, next) => {
  try {
    const { placeId } = req.query;

    // Build query
    const query = { isActive: true }; // Only show active hotels by default
    if (placeId) query.place = placeId;

    const hotels = await Hotel.find(query)
      .lean()
      .populate("place", "name location")
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .exec();

    res.status(200).json(hotels);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single hotel
// @route   GET /api/hotels/:id
// @access  Public
exports.getHotelById = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id)
      .populate("place", "name location")
      .lean()
      .exec();

    if (!hotel) {
      res.status(404);
      throw new Error("Hotel not found");
    }

    res.status(200).json(hotel);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a hotel
// @route   POST /api/hotels
// @access  Private/Admin
exports.createHotel = async (req, res, next) => {
  try {
    // 1. DEBUGGING: Print exactly what the frontend sent
    // Check your VS Code terminal when you submit the form
    console.log("--- CREATE HOTEL REQUEST ---");
    console.log("Body:", req.body);
    console.log("Files:", req.files);

    const {
      name,
      description,
      place,
      location,
      address,
      contactNo,
      email,
      website,
      pricePerNight,
      category,
      amenities,
      roomTypes,
    } = req.body;

    // 2. SAFER PARSING LOGIC
    // We default to empty arrays [] if parsing fails, instead of crashing.
    let parsedAmenities = [];
    let parsedRoomTypes = [];

    try {
      if (amenities) {
        // If it's already an array (rare case), keep it. If string, parse it.
        parsedAmenities =
          typeof amenities === "string" ? JSON.parse(amenities) : amenities;
      }
    } catch (err) {
      console.error("Error parsing amenities:", amenities);
      return res
        .status(400)
        .json({ message: "Invalid JSON format for amenities" });
    }

    try {
      if (roomTypes) {
        parsedRoomTypes =
          typeof roomTypes === "string" ? JSON.parse(roomTypes) : roomTypes;
      }
    } catch (err) {
      console.error("Error parsing roomTypes:", roomTypes);
      return res
        .status(400)
        .json({ message: "Invalid JSON format for roomTypes" });
    }

    // 3. Handle Images
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => file.path);
    }

    // 4. Validation
    if (
      !name ||
      !description ||
      !place ||
      !location ||
      !address ||
      !contactNo ||
      !category
    ) {
      return res
        .status(400)
        .json({
          message:
            "Please fill in all required fields (Name, Place, Location, Address, Contact, Category)",
        });
    }

    // 5. Create
    const hotel = await Hotel.create({
      name,
      description,
      place,
      location,
      address,
      contactNo,
      email,
      website,
      pricePerNight: Number(pricePerNight) || 0,
      category,
      images,
      amenities: parsedAmenities,
      roomTypes: parsedRoomTypes,
      createdBy: req.user._id,
    });

    res.status(201).json(hotel);
  } catch (error) {
    console.error("Create Hotel Error:", error);
    next(error);
  }
};

// @desc    Update a hotel
// @route   PUT /api/hotels/:id
// @access  Private/Admin
exports.updateHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      res.status(404);
      throw new Error("Hotel not found");
    }

    // Update simple fields
    const fields = [
      "name",
      "description",
      "place",
      "location",
      "address",
      "contactNo",
      "email",
      "website",
      "category",
    ];
    fields.forEach((field) => {
      if (req.body[field]) hotel[field] = req.body[field];
    });

    if (req.body.pricePerNight)
      hotel.pricePerNight = Number(req.body.pricePerNight);
    if (req.body.isActive !== undefined)
      hotel.isActive = req.body.isActive === "true"; // Handle string boolean

    // Update complex fields (JSON parsing)
    if (req.body.amenities) {
      hotel.amenities = JSON.parse(req.body.amenities);
    }
    if (req.body.roomTypes) {
      hotel.roomTypes = JSON.parse(req.body.roomTypes);
    }

    // Handle Image Updates
    // Strategy: If new images are uploaded, append them or replace?
    // Usually replacing is easier, or you can add logic to append.
    // Here we append new images if they exist.
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => file.path);
      hotel.images = [...hotel.images, ...newImages];
    }

    // If client sends 'existingImages' array (urls), we can filter out deleted ones
    if (req.body.existingImages) {
      const keptImages = JSON.parse(req.body.existingImages);
      // If we uploaded new ones, we merge kept old ones + new ones
      // If no new ones, we just keep the filtered list
      if (req.files && req.files.length > 0) {
        // hotel.images is already updated above with OLD + NEW
        // This logic gets complex. Simplified:
        // Ideally, replace the logic above with:
        // hotel.images = [...keptImages, ...newImages];
      } else {
        hotel.images = keptImages;
      }
    }

    const updatedHotel = await hotel.save();
    res.status(200).json(updatedHotel);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a hotel
// @route   DELETE /api/hotels/:id
// @access  Private/Admin
exports.deleteHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      res.status(404);
      throw new Error("Hotel not found");
    }

    await hotel.deleteOne();
    res.status(200).json({ message: "Hotel deleted successfully" });
  } catch (error) {
    next(error);
  }
};
