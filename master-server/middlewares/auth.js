const auth = require("../configs/firebaseConfig");
const User = require("../models/User");
const Response = require("../utils/handleError");

// Xác thực Firebase ID token ở header "Authorization: Bearer <idToken>" rồi gắn user vào req.user.
const requireAuth = async (req, res, next) => {
    try {
        const [type, token] = (req.headers.authorization || "").split(" ");
        if (type !== "Bearer" || !token) {
            return res.status(401).json(Response({ success: false, message: "Chưa đăng nhập" }));
        }

        const decoded = await auth.verifyIdToken(token);
        const user = await User.findOne({ where: { firebaseUid: decoded.uid } });
        if (!user) {
            return res.status(401).json(Response({ success: false, message: "Tài khoản không tồn tại" }));
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json(Response({ success: false, message: "Phiên đăng nhập không hợp lệ" }));
    }
};

module.exports = { requireAuth };
