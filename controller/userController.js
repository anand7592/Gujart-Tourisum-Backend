const User = require("../models/User");

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    // 1. Clean: Select only what you need (exclude password)
    // Optional: Add .lean() for faster performance if just reading data
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
      // Use standard error pattern
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
    // 1. SECURITY: Prevent Mass Assignment
    // Manually extract only the fields we allow an admin to set
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

    //2.Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error("User already exists");
    }

    // 3. Create User
    // Because we use .create(), the Password Hashing Hook WILL run.
    const user = await User.create({
      firstName,
      middleName,
      lastName,
      email,
      password,
      address,
      contactNo,
      isAdmin,
    });

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
    // 1. Find the user first
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    // 2. SECURITY: Manual Updates
    // We do NOT use findByIdAndUpdate here.
    // Why? Because we want the 'save' hook to run if the password changes.

    // Update fields only if they are sent in req.body
    user.firstName = req.body.firstName || user.firstName;
    user.middleName = req.body.middleName || user.middleName;
    user.lastName = req.body.lastName || user.lastName;
    user.email = req.body.email || user.email;
    user.address = req.body.address || user.address;
    user.contactNo = req.body.contactNo || user.contactNo;

    // Only update isAdmin if it is provided (and ensure it's a boolean)
    if (req.body.isAdmin !== undefined) {
      user.isAdmin = req.body.isAdmin;
    }

    // 3. Password Handling
    // If a new password is sent, update it.
    // The pre-save hook in your Model will detect this and hash it.
    if (req.body.password) {
      user.password = req.body.password;
    }

    //4.Save
    // This triggers validation AND the password hashing hook
    const updateUser = await user.save();

    // 5. Clean response
    const responseUser = updateUser.toObject();
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

    // Use .deleteOne() or .remove() depending on Mongoose version
    await user.deleteOne();

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};
