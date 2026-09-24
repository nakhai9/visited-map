const { DataTypes } = require("sequelize");
const sequelize = require("../configs/databaseConfig");

const User = sequelize.define(
    "User",
    {
        firebaseUid: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
            field: "firebase_uid",
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        name: DataTypes.STRING,
        avatar: DataTypes.STRING,
        firstName: {
            type: DataTypes.STRING,
            allowNull: true,
            field: "first_name",
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: true,
            field: "last_name",
        },
        fullName: {
            type: DataTypes.STRING,
            allowNull: true,
            field: "full_name",
        },
        phoneNumber: {
            type: DataTypes.STRING,
            allowNull: true,
            field: "phone_number",
        },
    },
    {
        tableName: "users",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: false,
    }
);

module.exports = User;
