const Response = require("../../utils/handleError");
const User = require("../../models/User");

const getUserById = async (req, res, next) => {
    try {
        const id = req.params.id;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json(Response({ success: false, message: "User not found" }));
        }

        return res.status(200).json(Response({ success: true, data: user }));
    } catch (error) {
        return res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
    }
}

const getUsers = async (req, res,next) => {
    try {
        const users = await User.findAll();

        return res.status(200).json(Response({ success: true, data: users ?? [] }));
    } catch (error) {
        return res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
    }
}

const createUser = async (req, res, next) => {
    try {
        const { firstName, lastName, phoneNumber, email, fullName } = req.body;

        if (!firstName || !lastName || !phoneNumber || !email || !fullName) {
            return res.status(400).json({ message: "Thiếu thông tin bắt buộc: firstName, lastName, phoneNumber, email, fullName" });
        }

        const existing = await User.findOne({ where: { email } });
        if (existing) {
            return res.status(409).json(Response({ success: false, message: "Email đã tồn tại" }));
        }

        const user = await User.create({ firstName, lastName, phoneNumber, email, fullName });

        return res.status(201).json(Response({ success: true, data: user }));
    } catch (error) {
        return res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
    }
}

module.exports = {
    getUserById,
    getUsers,
    createUser,
};
