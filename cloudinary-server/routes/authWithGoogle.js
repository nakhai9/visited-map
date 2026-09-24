const express = require("express");
const { authWithGoogle } = require("./../controllers/auth/authWithGoogle");

const router = express.Router();
router.post("/", authWithGoogle);

module.exports = router