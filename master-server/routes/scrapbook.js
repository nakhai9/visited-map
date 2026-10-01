const express = require("express");
const multer = require("multer");
const { requireAuth } = require("../middlewares/auth");
const { getMyScrapbook, saveScrapbook, deleteScrapbook } = require("../controllers/scrapbook/scrapbook");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 100 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("Chỉ hỗ trợ file hình ảnh"));
        }
        cb(null, true);
    },
});

// Lỗi từ multer (file quá lớn, sai loại...) trả 400 thay vì 500.
const handleUpload = (req, res, next) =>
    upload.any()(req, res, (error) => {
        if (!error) return next();
        return res.status(400).json({ success: false, message: error.message });
    });

const router = express.Router();
router.use(requireAuth);
router.get("/", getMyScrapbook);
router.post("/", handleUpload, saveScrapbook);
router.delete("/:id", deleteScrapbook);

module.exports = router;
