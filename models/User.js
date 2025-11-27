const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");

// 1. Define a reusable sanitizer function
// This converts characters like <, >, &, ', " to HTML entities
const sanitize = (value) => {
  if (typeof value === 'string') {
    return validator.escape(value);
  }
  return value;
};

const userSchema = new mongoose.Schema(
  {
    firstName: { 
      type: String, 
      required: true, 
      set: sanitize // Apply sanitizer
    },
    middleName: { 
      type: String, 
      default: "", 
      set: sanitize // Apply sanitizer
    },
    lastName: { 
      type: String, 
      required: true, 
      set: sanitize // Apply sanitizer
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      // Note: We don't usually escape emails, we validate them.
      // Escaping email might break login if it contains valid special chars.
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    address: { 
      type: String, 
      required: true, 
      set: sanitize // Apply sanitizer (Critical for text blocks)
    },
    contactNo: { 
      type: String, 
      required: true,
      set: sanitize // Apply sanitizer
    },
    isAdmin: { type: Boolean, default: false },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
  },
  { timestamps: true }
);

// Hash password before save
// We remove 'next' from the arguments and the code.
// Mongoose knows to wait because we used 'async'.
userSchema.pre("save", async function () {
  // 1. If password is not modified, just return (exit the function)
  if (!this.isModified("password")) return;

  // 2. Hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);