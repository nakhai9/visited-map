const express = require("express");
const router = express.Router();

const { uploadFiles } = require("../controllers/upload");
const multer = require("multer");

const upload = multer({
    storage: multer.memoryStorage(),
});


router.post("/", upload.single("file"), uploadFiles);

module.exports = router;