const { DataTypes } = require("sequelize");
const sequelize = require("../configs/databaseConfig");

// Một scrapbook = bản đồ của một user cho một quốc gia/bản đồ (countryCode).
const Scrapbook = sequelize.define(
    "Scrapbook",
    {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "user_id",
        },
        countryCode: {
            type: DataTypes.STRING(20),
            allowNull: false,
            field: "country_code",
        },
        title: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        showLabel: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: "show_label",
        },
        showStats: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: "show_stats",
        },
    },
    {
        tableName: "scrapbooks",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        charset: "utf8mb4",
        collate: "utf8mb4_unicode_ci",
        indexes: [{ unique: true, name: "uq_scrapbook_user_country", fields: ["user_id", "country_code"] }],
    }
);

module.exports = Scrapbook;
