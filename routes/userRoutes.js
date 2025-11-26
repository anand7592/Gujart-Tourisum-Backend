const express = require("express");
const { getUsers, createUser } = require("../controller/userController");

const router = express.Router();

// Define routes
router.get("/", getUsers);
router.post("/", createUser);

module.exports = router;
