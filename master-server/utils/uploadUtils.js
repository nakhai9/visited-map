const streamifier = require("streamifier");
const cloudinary  = require("../configs/cloudinaryConfig");
const Utils = {
   file: {
        handleUploadToCloudinary: (file, options = {}) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { resource_type: "auto", ...options },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                )
                streamifier.createReadStream(file.buffer).pipe(stream);
            })
        },
        // Xoá ảnh trên Cloudinary, không ném lỗi (xoá ảnh thất bại không được làm hỏng luồng chính).
        handleDeleteFromCloudinary: async (publicId) => {
            if (!publicId) return;
            try {
                await cloudinary.uploader.destroy(publicId, { invalidate: true });
            } catch (error) {
                console.error("Xoá ảnh Cloudinary thất bại:", publicId, error.message);
            }
        }
   }
}

module.exports = Utils;