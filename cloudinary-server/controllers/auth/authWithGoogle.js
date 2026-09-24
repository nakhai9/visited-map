const auth = require("../../configs/firebaseConfig");
const User = require("../../models/User");
const Response = require("../../utils/handleError");

const authWithGoogle = async (req, res, next) => {
    try {
        if (!req.body.idToken) {
            return res.status(400).json({ message: "Id token not existing" });
        }
        const idToken = req.body.idToken

        const decoded = await auth.verifyIdToken(idToken);

        const [user] = await User.findOrCreate({
            where: { firebaseUid: decoded.uid },
            defaults: {
                firebaseUid: decoded.uid,
                email: decoded.email,
                name: decoded.name,
                avatar: decoded.picture,
            },
        });

        return res.status(200).json(Response({ success: true, data: user }));
    } catch (error) {
        return res.status(500).json({ message: "Đăng nhập thất bại", error: error.message });
    }
}

module.exports = {
    authWithGoogle,
};