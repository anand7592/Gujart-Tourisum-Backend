const Rating = require("../models/Rating");

// @desc    Get all ratings
// @route   GET /api/ratings
// @access  Public
exports.getRatings = async (req, res, next) => {
  try {
    const { hotelId, placeId, subPlaceId, ratingType } = req.query;
    
    let query = { isApproved: true };
    
    if (ratingType) query.ratingType = ratingType;
    if (hotelId) query.hotel = hotelId;
    if (placeId) query.place = placeId;
    if (subPlaceId) query.subPlace = subPlaceId;
    
    const ratings = await Rating.find(query)
      .lean()
      .sort({ createdAt: -1 })
      .populate("user", "firstName lastName")
      .populate("hotel", "name")
      .populate("place", "name")
      .populate("subPlace", "name");
      
    res.status(200).json(ratings);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single rating
// @route   GET /api/ratings/:id
// @access  Public
exports.getRatingById = async (req, res, next) => {
  try {
    const rating = await Rating.findById(req.params.id)
      .populate("user", "firstName lastName")
      .populate("hotel", "name")
      .populate("place", "name")
      .populate("subPlace", "name");
      
    if (!rating) {
      res.status(404);
      throw new Error("Rating not found");
    }
    
    res.status(200).json(rating);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a rating
// @route   POST /api/ratings
// @access  Private
exports.createRating = async (req, res, next) => {
  try {
    const {
      ratingType,
      hotelId,
      placeId,
      subPlaceId,
      rating,
      title,
      comment,
      cleanliness,
      service,
      location,
      valueForMoney,
    } = req.body;

    // Handle multiple images
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => file.path);
    }

    if (!ratingType || !rating || !title || !comment) {
      res.status(400);
      throw new Error("Please fill in all required fields");
    }

    // Validate that the appropriate ID is provided based on ratingType
    if (ratingType === "Hotel" && !hotelId) {
      res.status(400);
      throw new Error("Hotel ID is required for hotel ratings");
    }
    if (ratingType === "Place" && !placeId) {
      res.status(400);
      throw new Error("Place ID is required for place ratings");
    }
    if (ratingType === "SubPlace" && !subPlaceId) {
      res.status(400);
      throw new Error("SubPlace ID is required for subplace ratings");
    }

    // Check if user already rated this item
    const existingRating = await Rating.findOne({
      user: req.user._id,
      ratingType,
      ...(hotelId && { hotel: hotelId }),
      ...(placeId && { place: placeId }),
      ...(subPlaceId && { subPlace: subPlaceId }),
    });

    if (existingRating) {
      res.status(400);
      throw new Error("You have already rated this item");
    }

    const newRating = await Rating.create({
      user: req.user._id,
      ratingType,
      hotel: hotelId || null,
      place: placeId || null,
      subPlace: subPlaceId || null,
      rating: Number(rating),
      title,
      comment,
      cleanliness: cleanliness ? Number(cleanliness) : undefined,
      service: service ? Number(service) : undefined,
      location: location ? Number(location) : undefined,
      valueForMoney: valueForMoney ? Number(valueForMoney) : undefined,
      images,
    });

    const populatedRating = await Rating.findById(newRating._id)
      .populate("user", "firstName lastName")
      .populate("hotel", "name")
      .populate("place", "name")
      .populate("subPlace", "name");

    res.status(201).json(populatedRating);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a rating
// @route   PUT /api/ratings/:id
// @access  Private
exports.updateRating = async (req, res, next) => {
  try {
    const rating = await Rating.findById(req.params.id);

    if (!rating) {
      res.status(404);
      throw new Error("Rating not found");
    }

    // Check if user owns this rating
    if (rating.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to update this rating");
    }

    // Update fields
    rating.rating = req.body.rating ? Number(req.body.rating) : rating.rating;
    rating.title = req.body.title || rating.title;
    rating.comment = req.body.comment || rating.comment;
    rating.cleanliness = req.body.cleanliness ? Number(req.body.cleanliness) : rating.cleanliness;
    rating.service = req.body.service ? Number(req.body.service) : rating.service;
    rating.location = req.body.location ? Number(req.body.location) : rating.location;
    rating.valueForMoney = req.body.valueForMoney ? Number(req.body.valueForMoney) : rating.valueForMoney;

    // Handle new images
    if (req.files && req.files.length > 0) {
      rating.images = req.files.map((file) => file.path);
    }

    const updatedRating = await rating.save();
    
    const populatedRating = await Rating.findById(updatedRating._id)
      .populate("user", "firstName lastName");
    
    res.status(200).json(populatedRating);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a rating
// @route   DELETE /api/ratings/:id
// @access  Private
exports.deleteRating = async (req, res, next) => {
  try {
    const rating = await Rating.findById(req.params.id);

    if (!rating) {
      res.status(404);
      throw new Error("Rating not found");
    }

    // Check if user owns this rating or is admin
    if (rating.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      res.status(403);
      throw new Error("Not authorized to delete this rating");
    }

    await rating.deleteOne();
    res.status(200).json({ message: "Rating deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark rating as helpful
// @route   PUT /api/ratings/:id/helpful
// @access  Private
exports.markHelpful = async (req, res, next) => {
  try {
    const rating = await Rating.findById(req.params.id);

    if (!rating) {
      res.status(404);
      throw new Error("Rating not found");
    }

    rating.helpfulCount += 1;
    await rating.save();

    res.status(200).json({ helpfulCount: rating.helpfulCount });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Add response to rating
// @route   PUT /api/ratings/:id/respond
// @access  Private/Admin
exports.addAdminResponse = async (req, res, next) => {
  try {
    const rating = await Rating.findById(req.params.id);

    if (!rating) {
      res.status(404);
      throw new Error("Rating not found");
    }

    rating.adminResponse = req.body.response || "";
    await rating.save();

    const populatedRating = await Rating.findById(rating._id)
      .populate("user", "firstName lastName");

    res.status(200).json(populatedRating);
  } catch (error) {
    next(error);
  }
};