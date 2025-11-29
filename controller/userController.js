const User = require("../models/User");

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password").lean();
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Create user (Admin only)
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res, next) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      email,
      password,
      address,
      contactNo,
      isAdmin,
    } = req.body;

    // 1. Basic Validation
    if (!email || !password || !firstName) {
      res.status(400);
      throw new Error("Please fill in all required fields");
    }

    // 2. Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error("User already exists");
    }

    // 3. Create User
    // The Model's pre-save hook will handle password hashing
    const user = await User.create({
      firstName,
      middleName,
      lastName,
      email,
      password,
      address,
      contactNo,
      isAdmin: isAdmin || false, // Default to false if undefined
    });

    // 4. Clean response
    const userData = user.toObject();
    delete userData.password;

    res.status(201).json(userData);
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    // Manual Updates (allows Mongoose hooks to run if password changes)
    user.firstName = req.body.firstName || user.firstName;
    user.middleName = req.body.middleName || user.middleName;
    user.lastName = req.body.lastName || user.lastName;
    user.email = req.body.email || user.email;
    user.address = req.body.address || user.address;
    user.contactNo = req.body.contactNo || user.contactNo;

    if (req.body.isAdmin !== undefined) {
      user.isAdmin = req.body.isAdmin;
    }

    if (req.body.password) {
      user.password = req.body.password;
    }

    // BUG FIX: Renamed variable from 'updateUser' to 'updatedUser'
    // to avoid conflict with the function name.
    const updatedUser = await user.save();

    const responseUser = updatedUser.toObject();
    delete responseUser.password;

    res.status(200).json(responseUser);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    // SECURITY FIX: Prevent Admin from deleting themselves
    // req.user is set by your authMiddleware
    if (user._id.toString() === req.user._id.toString()) {
      res.status(400);
      throw new Error("You cannot delete your own admin account.");
    }

    await user.deleteOne();

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};