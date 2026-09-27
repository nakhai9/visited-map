const express = require("express");
const { getUserById, createUser, getUsers } = require("./../controllers/user/user");

const router = express.Router();
router.get("/:id", getUserById);
router.post("/", createUser);
router.get("/", getUsers)

module.exports = router
