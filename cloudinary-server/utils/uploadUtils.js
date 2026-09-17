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
        }
   }
}

module.exports = Utils;