const Place = require("../models/Place");

// @desc    Get all places
// @route   GET /api/places
// @access  Public (or Private depending on needs)
exports.getPlaces = async (req, res, next) => {
  try {
    const places = await Place.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "email firstName lastName"); // Newest first
    res.status(200).json(places);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a place
// @route   POST /api/places
// @access  Private/Admin
exports.createPlace = async (req, res, next) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);
    const { name, description, location, price } = req.body;

    // Get Cloudinary URL if file was uploaded
    // If no file, use an empty string or default image
    const image = req.file ? req.file.path : "";

    if (!name || !description || !location) {
      res.status(400);
      throw new Error(
        "Please fill in all required fields (Name, Desc, Location)"
      );
    }

    const place = await Place.create({
      name,
      description,
      location,
      price: price || 0,
      image, // Save the Cloudinary URL
      createdBy: req.user._id, // Track who made it
    });

    res.status(201).json(place);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a place
// @route   PUT /api/places/:id
// @access  Private/Admin
exports.updatePlace = async (req, res, next) => {
  try {
    const place = await Place.findById(req.params.id);

    if (!place) {
      res.status(404);
      throw new Error("Place not found");
    }

    // Update fields
    place.name = req.body.name || place.name;
    place.description = req.body.description || place.description;
    place.location = req.body.location || place.location;
    place.price = req.body.price || place.price;

    // Update Image ONLY if a new file is uploaded
    if (req.file) {
      place.image = req.file.path;
    }

    const updatedPlace = await place.save();
    res.status(200).json(updatedPlace);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a place
// @route   DELETE /api/places/:id
// @access  Private/Admin
exports.deletePlace = async (req, res, next) => {
  try {
    const place = await Place.findById(req.params.id);

    if (!place) {
      res.status(404);
      throw new Error("Place not found");
    }

    await place.deleteOne();
    res.status(200).json({ message: "Place deleted successfully" });
  } catch (error) {
    next(error);
  }
};
