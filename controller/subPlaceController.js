const SubPlace = require("../models/SubPlace");

// @desc    Get all sub-places
// @route   GET /api/subplaces
// @access  Public
exports.getSubPlaces = async (req, res, next) => {
  try {
    const { placeId } = req.query; // Filter by parent place if provided
    
    const query = placeId ? { place: placeId } : {};
    
    const subPlaces = await SubPlace.find(query)
      .sort({ createdAt: -1 })
      .populate("place", "name location")
      .populate("createdBy", "firstName lastName");
      
    res.status(200).json(subPlaces);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single sub-place
// @route   GET /api/subplaces/:id
// @access  Public
exports.getSubPlaceById = async (req, res, next) => {
  try {
    const subPlace = await SubPlace.findById(req.params.id)
      .populate("place", "name location")
      .populate("createdBy", "firstName lastName");
      
    if (!subPlace) {
      res.status(404);
      throw new Error("SubPlace not found");
    }
    
    res.status(200).json(subPlace);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a sub-place
// @route   POST /api/subplaces
// @access  Private/Admin
exports.createSubPlace = async (req, res, next) => {
  try {
    const {
      name,
      description,
      place,
      location,
      entryFee,
      openTime,
      closeTime,
      bestTimeToVisit,
      features,
    } = req.body;

    let image = "";
    if (req.file && req.file.path) {
      image = req.file.path;
    }

    if (!name || !description || !place || !location) {
      res.status(400);
      throw new Error("Please fill in all required fields");
    }

    const subPlace = await SubPlace.create({
      name,
      description,
      place,
      location,
      image,
      entryFee: Number(entryFee) || 0,
      openTime: openTime || "9:00 AM",
      closeTime: closeTime || "6:00 PM",
      bestTimeToVisit: bestTimeToVisit || "",
      features: features ? JSON.parse(features) : [],
      createdBy: req.user._id,
    });

    const populatedSubPlace = await SubPlace.findById(subPlace._id).populate(
      "place",
      "name location"
    );

    res.status(201).json(populatedSubPlace);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a sub-place
// @route   PUT /api/subplaces/:id
// @access  Private/Admin
exports.updateSubPlace = async (req, res, next) => {
  try {
    const subPlace = await SubPlace.findById(req.params.id);

    if (!subPlace) {
      res.status(404);
      throw new Error("SubPlace not found");
    }

    // Update fields
    subPlace.name = req.body.name || subPlace.name;
    subPlace.description = req.body.description || subPlace.description;
    subPlace.place = req.body.place || subPlace.place;
    subPlace.location = req.body.location || subPlace.location;
    subPlace.entryFee = req.body.entryFee ? Number(req.body.entryFee) : subPlace.entryFee;
    subPlace.openTime = req.body.openTime || subPlace.openTime;
    subPlace.closeTime = req.body.closeTime || subPlace.closeTime;
    subPlace.bestTimeToVisit = req.body.bestTimeToVisit || subPlace.bestTimeToVisit;
    
    if (req.body.features) {
      subPlace.features = JSON.parse(req.body.features);
    }

    if (req.file && req.file.path) {
      subPlace.image = req.file.path;
    }

    const updatedSubPlace = await subPlace.save();
    
    const populatedSubPlace = await SubPlace.findById(updatedSubPlace._id).populate(
      "place",
      "name location"
    );
    
    res.status(200).json(populatedSubPlace);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a sub-place
// @route   DELETE /api/subplaces/:id
// @access  Private/Admin
exports.deleteSubPlace = async (req, res, next) => {
  try {
    const subPlace = await SubPlace.findById(req.params.id);

    if (!subPlace) {
      res.status(404);
      throw new Error("SubPlace not found");
    }

    await subPlace.deleteOne();
    res.status(200).json({ message: "SubPlace deleted successfully" });
  } catch (error) {
    next(error);
  }
};